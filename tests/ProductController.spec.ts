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
    jest.setTimeout(10000); // Increase timeout to 10 seconds
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

  describe("GET /products with pagination", () => {
    it("should return paginated products with 200 status", async () => {
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
        {
          name: "Product 3",
          price: 300,
          description: "Description for product 3",
          stock: 30,
        },
      ]);

      let response = await request(app)
        .get("/products?page=1&limit=2")
        .expect(200);

      expect(response.body.data).toHaveLength(2);

      response = await request(app)
      .get("/products?page=2&limit=2")
      .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty("name", "Product 3");
    });
  });

  describe("PUT /products/:id", () => {
    it("should update a product successfully", async () => {
      const product = await ProductModel.create({
        name: "Existing Product",
        price: 200,
        description: "An existing product description",
        stock: 20,
      });

      const updatedProductData = {
        name: "Updated Product",
        price: 250,
      };

      const response = await request(app)
        .put(`/products/${product._id}`)
        .send(updatedProductData)
        .expect(200);

      expect(response.body.data).toHaveProperty("_id", product._id.toString());
      expect(response.body.data.name).toBe(updatedProductData.name);
      expect(response.body.data.price).toBe(updatedProductData.price);

      const updatedProduct = await ProductModel.findById(product._id);
      expect(updatedProduct).not.toBeNull();
      expect(updatedProduct?.name).toBe(updatedProductData.name);
      expect(updatedProduct?.price).toBe(updatedProductData.price);
    });

    it("should return 404 if the product is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/products/${nonExistentId}`)
        .send({ name: "Updated Product" })
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Product not found");
    });
  });
});
