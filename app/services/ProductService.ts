import mongoose from "mongoose";
import { ProductModel, CreateProductDTO } from "../models/Product";
import { uploadFileToS3 } from "../config/upload";
import { AppError } from "../middleware/errorHandler";

export class ProductServiceClass {
  // Method to create a new product
  async createProduct(
    productData: CreateProductDTO,
    productImages?: Express.Multer.File[]
  ) {
    const images: string[] = [];

    try {
      if (productImages) {
        const uploadDir = "products";

        await Promise.all(
          productImages.map(async (productImage) => {
            const imageUrl = await uploadFileToS3(productImage, uploadDir);
            images.push(imageUrl);
          })
        );
      }

      productData.images = images;

      return await ProductModel.create(productData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError("Product with the same name already exists. Update product instead.", 400);
      }
      throw error;
    }
  }

  // Method to get all products
  async getAllProducts() {
    try {
      return await ProductModel.find();
    } catch (error) {
      throw error;
    }
  }
}

export const ProductService = new ProductServiceClass();
