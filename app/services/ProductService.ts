import { ProductModel, CreateProductDTO } from "../models/Product";
import { deleteFileFromS3, uploadFileToS3 } from "../config/upload";
import { AppError } from "../middleware/errorHandler";
import mongoose from "mongoose";

export interface ProductFilterOptions {
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string[];
}

export class ProductServiceClass {
  async createProduct(
    productData: CreateProductDTO,
    userId: mongoose.Schema.Types.ObjectId,
    productImages?: Express.Multer.File[],
  ) {
    try {
      if (productImages) {
        const images = productImages
          ? await this.uploadProductImages(productImages)
          : [];
        productData.images = images;
      }

      return await ProductModel.create({...productData, vendor: userId });
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(
          "Product with the same name already exists. Update product instead.",
          400
        );
      }
      throw error;
    }
  }

  // Updated method to get all products with pagination and filtering
  async getAllProducts(options: ProductFilterOptions = {}) {
    try {
      const { search, minPrice, maxPrice, minStock, category, tags, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Add price range filters if provided
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }

      // Add stock filter if provided
      if (minStock !== undefined) {
        filter.stock = { $gte: minStock };
      }

      // Add category filter if provided
      if (category) {
        filter.category = category;
      }

      // Add tags filter if provided
      if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive search in name
          { description: { $regex: search, $options: "i" } }, // Case-insensitive search in description
          { category: { $regex: search, $options: "i" } }, // Case-insensitive search in category
        ]
      }

      const products = await ProductModel.find(filter)
        .sort({ createdAt: -1, name: 1 })
        .skip(skip)
        .limit(limit);

      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductById(productId: string) {
    const product = await ProductModel.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  // Method to update a product by ID
  async updateProduct(
    productId: string,
    updateData: Partial<CreateProductDTO>,
    productImages?: Express.Multer.File[]
  ) {
    try {
      if (productImages) {
        const images = productImages
          ? await this.uploadProductImages(productImages)
          : [];
        if (images.length) {
          updateData.images = images;
        }
      }

      const updatedProduct = await ProductModel.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        throw new AppError("Product not found", 404);
      }

      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }

  // Method to delete a product by ID
  async deleteProduct(productId: string, userId: mongoose.Schema.Types.ObjectId) {
    try {
      const product = await ProductModel.findById(productId);

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      // Delete product images from S3
      if (product.images && product.images.length > 0) {
        await this.deleteImageFromS3(product.images);
      }

      await ProductModel.findByIdAndDelete(productId);
    } catch (error) {
      throw error;
    }
  }

  private async deleteImageFromS3(images: string[]): Promise<void> {
    await Promise.all(
      images.map(async (imageUrl: string) => {
        await deleteFileFromS3(imageUrl);
      })
    );
  }

  private async uploadProductImages(
    productImages: Express.Multer.File[]
  ): Promise<string[]> {
    const images: string[] = [];
    const uploadDir = "products";

    await Promise.all(
      productImages.map(async (productImage) => {
        const imageUrl = await uploadFileToS3(productImage, uploadDir);
        images.push(imageUrl);
      })
    );

    return images;
  }
}

export const ProductService = new ProductServiceClass();
