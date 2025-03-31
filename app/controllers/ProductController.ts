import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/ProductService";
import { AppError } from "../middleware/errorHandler";
import { CreateProductDTO } from "../models/Product";

class ProductControllerClass {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, price, description, images } = req.body;

      // Input validation
      if (!name || typeof name !== "string") {
        throw new AppError("Invalid product name", 400);
      }

      if (typeof price !== "number" || price < 0) {
        throw new AppError("Invalid product price", 400);
      }

      if (!description || typeof description !== "string") {
        throw new AppError("Invalid product description", 400);
      }

      const productData: CreateProductDTO = { name, price, description, images };
      const product = await ProductService.createProduct(productData);

      res.status(201).json({
        status: "success",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ProductController = new ProductControllerClass();
