import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/ProductService";
import { AppError } from "../middleware/errorHandler";
import { CreateProductDTO } from "../models/Product";

class ProductControllerClass {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productData: CreateProductDTO = req.body;

      const filesArray = Array.isArray(req.files)
        ? req.files
        : req.files
        ? Object.values(req.files).flat()
        : undefined;

      const product = await ProductService.createProduct(productData, filesArray);

      res.status(201).json({
        status: "success",
        data: product,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        const message = Object.values(error.errors).map((err: any) => err.message).join(", ");
        error = new AppError(message, 400);
      }
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
