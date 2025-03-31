import request from "supertest";
import { createApp } from "../app/createApp";
import { ProductModel } from "../app/models/Product";
import { closeDatabase, initializeDatabase } from "../app/config/database";
import mongoose from "mongoose";

async function dropProducts() {
  await ProductModel.deleteMany({});
}

describe("ProductController", () => {
  const app = createApp();

  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await dropProducts();
  });

  afterAll(async () => {
    await dropProducts();
    await closeDatabase();
  });

  describe("POST /products", () => {
    it("should create a new product and return 201 status", async () => {
      const newProduct = {
        name: "Test Product",
        price: 100,
        description: "A test product description",
        stock: 50,
      };

      const response = await request(app)
        .post("/products")
        .send(newProduct)
        .expect(201);

      expect(response.body.data.name).toBe(newProduct.name);
      expect(response.body.data.price).toBe(newProduct.price);
      expect(response.body.data.description).toBe(newProduct.description);
      expect(response.body.data.stock).toBe(newProduct.stock);

      const savedProduct = await ProductModel.findById(response.body.data._id);
      expect(savedProduct).not.toBeNull();
      expect(savedProduct?.name).toBe(newProduct.name);
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteProduct = {
        price: 100,
      };

      const response = await request(app)
        .post("/products")
        .send(incompleteProduct)
        .expect(400);

      expect(response.body.status).toBe("error");
    });

    // it("should create a new product with images and return 201 status", async () => {
    //   const newProductWithImages = {
    //     name: "Test Product with Images",
    //     price: 150,
    //     description: "A test product with images",
    //     stock: 30,
    //   };

    //   const mockImages = ["mockImage1.jpg", "mockImage2.jpg"];

    //   jest.mock("multer", () => {
    //     return {
    //       storage: jest.fn(() => ({
    //     _handleFile: jest.fn((req, file, cb) => {
    //       cb(null, { path: `/mock/path/${file.originalname}`, size: 1234 });
    //     }),
    //     _removeFile: jest.fn((req, file, cb) => {
    //       cb(null);
    //     }),
    //       })),
    //     };
    //   });

    //   const response = await request(app)
    //     .post("/products")
    //     .field("name", newProductWithImages.name)
    //     .field("price", newProductWithImages.price)
    //     .field("description", newProductWithImages.description)
    //     .field("stock", newProductWithImages.stock)
    //     .attach("images", mockImages[0])
    //     .attach("images", mockImages[1])
    //     .expect(201);

    //   expect(response.body.data).toHaveProperty("_id");
    //   expect(response.body.data.name).toBe(newProductWithImages.name);
    //   expect(response.body.data.price).toBe(newProductWithImages.price);
    //   expect(response.body.data.description).toBe(newProductWithImages.description);
    //   expect(response.body.data.stock).toBe(newProductWithImages.stock);
    //   expect(response.body.data.images).toHaveLength(2);

    //   const savedProduct = await ProductModel.findById(response.body.data._id);
    //   expect(savedProduct).not.toBeNull();
    //   expect(savedProduct?.images).toHaveLength(2);
    // });
  });

  describe("GET /products/:id", () => {
    it("should return a product by ID with 200 status", async () => {
      const product = await ProductModel.create({
        name: "Existing Product",
        price: 200,
        description: "An existing product description",
        stock: 20,
      });

      const response = await request(app)
        .get(`/products/${product._id}`)
        .expect(200);

      expect(response.body.data).toHaveProperty("_id", product._id.toString());
      expect(response.body.data.name).toBe(product.name);
      expect(response.body.data.price).toBe(product.price);
      expect(response.body.data.description).toBe(product.description);
      expect(response.body.data.stock).toBe(product.stock);
    });

    it("should return 404 if product is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Product not found");
    });
  });

  describe("GET /products", () => {
    it("should return all products with 200 status", async () => {
      await ProductModel.create([
        {
          name: "Product 1",
          price: 100,
          description: "Description for product 1",
          stock: 10,
        },
        {
          name: "Product 2",
          price: 200,
          description: "Description for product 2",
          stock: 20,
        },
      ]);

      const response = await request(app)
        .get("/products")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty("name", "Product 1");
      expect(response.body.data[1]).toHaveProperty("name", "Product 2");
    });
  });
});
