import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/ProductService";
import { AppError } from "../middleware/errorHandler";
import { CreateProductDTO } from "../models/Product";

class ProductControllerClass {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productData: CreateProductDTO = req.body;

      const product = await ProductService.createProduct(productData);

      res.status(201).json({
        status: "success",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAllProducts();

      res.status(200).json({
        status: "success",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ProductController = new ProductControllerClass();
