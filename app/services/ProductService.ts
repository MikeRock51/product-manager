import mongoose from 'mongoose';
import { ProductModel, CreateProductDTO } from '../models/Product';

export class ProductServiceClass {
  // Method to create a new product
  async createProduct(productData: CreateProductDTO) {
    try {
      return await ProductModel.create(productData);
    } catch (error: any) {
      if (error.code === 11000) { // MongoDB duplicate key error code
        throw new Error('Product with the same name already exists.');
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
