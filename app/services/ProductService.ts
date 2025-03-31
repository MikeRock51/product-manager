import mongoose from 'mongoose';
import { ProductModel, CreateProductDTO } from '../models/Product';

export class ProductServiceClass {
  // Method to create a new product
  async createProduct(productData: CreateProductDTO) {
    return ProductModel.create(productData);
  }
}

export const ProductService = new ProductServiceClass();
