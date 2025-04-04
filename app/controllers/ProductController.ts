import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/ProductService";
import { AppError } from "../middleware/errorHandler";
import { CreateProductDTO } from "../models/Product";

class ProductControllerClass {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productData: CreateProductDTO = req.body;
      if (!req.user || !req.user._id) {
        throw new AppError("User ID is required", 400);
      }
      const userId = req.user._id;

      const filesArray = Array.isArray(req.files)
        ? req.files
        : req.files
        ? Object.values(req.files).flat()
        : undefined;

      const product = await ProductService.createProduct(productData, userId, filesArray);

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
      const options = req.query;
      const products = await ProductService.getAllProducts(options);

      res.status(200).json({
        status: "success",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.id;

      if (!productId) {
        throw new AppError("Product ID is required", 400);
      }

      const product = await ProductService.getProductById(productId);

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      res.status(200).json({
        status: "success",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.id;
      const updateData = req.body;

      if (!productId) {
        throw new AppError("Product ID is required", 400);
      }

      const filesArray = Array.isArray(req.files)
        ? req.files
        : req.files
        ? Object.values(req.files).flat()
        : undefined;

      const updatedProduct = await ProductService.updateProduct(productId, updateData, filesArray);

      res.status(200).json({
        status: "success",
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.id;
      const userId = req.user!._id!;

      if (!productId) {
        throw new AppError("Product ID is required", 400);
      }

      await ProductService.deleteProduct(productId, userId);

      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }
}

export const ProductController = new ProductControllerClass();
