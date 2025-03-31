import mongoose from "mongoose";
import { ProductModel, CreateProductDTO } from "../models/Product";
import { uploadFileToS3 } from "../config/upload";
import { AppError } from "../middleware/errorHandler";

export class ProductServiceClass {
  async createProduct(
    productData: CreateProductDTO,
    productImages?: Express.Multer.File[]
  ) {
    try {
      if (productImages) {
        const images = productImages
          ? await this.uploadProductImages(productImages)
          : [];
        productData.images = images;
      }

      return await ProductModel.create(productData);
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

  // Method to get all products
  async getAllProducts() {
    try {
      return await ProductModel.find().sort({ createdAt: -1, name: 1 });
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
