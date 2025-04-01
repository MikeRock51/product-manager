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

  describe("GET /products with filters", () => {
    beforeEach(async () => {
      // Create test products with different price points and stock levels
      await ProductModel.create([
        {
          name: "Budget Product",
          price: 25,
          description: "A low-cost product",
          stock: 5,
        },
        {
          name: "Mid-range Product",
          price: 100,
          description: "A mid-range product",
          stock: 15,
        },
        {
          name: "Premium Product",
          price: 500,
          description: "A high-end product",
          stock: 3,
        },
        {
          name: "Luxury Product",
          price: 1000,
          description: "A luxury product",
          stock: 0,
        },
      ]);
    });

    it("should filter products by minimum price", async () => {
      const response = await request(app)
        .get("/products?minPrice=100")
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((p: any) => p.name)).toContain("Mid-range Product");
      expect(response.body.data.map((p: any) => p.name)).toContain("Premium Product");
      expect(response.body.data.map((p: any) => p.name)).toContain("Luxury Product");
      expect(response.body.data.map((p: any) => p.name)).not.toContain("Budget Product");

      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(100);
      });
    });

    it("should filter products by maximum price", async () => {
      const response = await request(app)
        .get("/products?maxPrice=100")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((p: any) => p.name)).toContain("Budget Product");
      expect(response.body.data.map((p: any) => p.name)).toContain("Mid-range Product");

      response.body.data.forEach((product: any) => {
        expect(product.price).toBeLessThanOrEqual(100);
      });
    });

    it("should filter products by price range", async () => {
      const response = await request(app)
        .get("/products?minPrice=50&maxPrice=600")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((p: any) => p.name)).toContain("Mid-range Product");
      expect(response.body.data.map((p: any) => p.name)).toContain("Premium Product");

      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(50);
        expect(product.price).toBeLessThanOrEqual(600);
      });
    });

    it("should filter products by minimum stock", async () => {
      const response = await request(app)
        .get("/products?minStock=5")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((p: any) => p.name)).toContain("Budget Product");
      expect(response.body.data.map((p: any) => p.name)).toContain("Mid-range Product");

      response.body.data.forEach((product: any) => {
        expect(product.stock).toBeGreaterThanOrEqual(5);
      });
    });

    it("should filter products by minimum stock and price range", async () => {
      const response = await request(app)
        .get("/products?minStock=5&minPrice=50&maxPrice=200")
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("Mid-range Product");
      expect(response.body.data[0].price).toBe(100);
      expect(response.body.data[0].stock).toBe(15);
    });

    it("should return empty array when no products match filters", async () => {
      const response = await request(app)
        .get("/products?minPrice=2000")
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it("should handle invalid filter values gracefully", async () => {
      const response = await request(app)
        .get("/products?minPrice=invalid&maxPrice=alsoinvalid")
        .expect(200);

      // Should ignore invalid filters and return all products
      expect(response.body.data).toHaveLength(4);
    });
  });

  describe("GET /products with search", () => {
    beforeEach(async () => {
      // Create test products with different names
      await ProductModel.create([
        {
          name: "iPhone 13 Pro",
          price: 999,
          description: "Apple smartphone",
          stock: 10,
        },
        {
          name: "Samsung Galaxy S21",
          price: 799,
          description: "Samsung smartphone",
          stock: 15,
        },
        {
          name: "Google Pixel 6",
          price: 699,
          description: "Google smartphone",
          stock: 8,
        },
        {
          name: "iPad Pro 12.9",
          price: 1099,
          description: "Apple tablet",
          stock: 5,
        }
      ]);
    });

    it("should search products by name", async () => {
      const response = await request(app)
        .get("/products?search=iPhone")
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("iPhone 13 Pro");
    });

    it("should return products with partial name match", async () => {
      const response = await request(app)
        .get("/products?search=Pro")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((p: any) => p.name)).toContain("iPhone 13 Pro");
      expect(response.body.data.map((p: any) => p.name)).toContain("iPad Pro 12.9");
    });

    it("should be case-insensitive when searching", async () => {
      const response = await request(app)
        .get("/products?search=iphone")
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("iPhone 13 Pro");
    });

    it("should combine search with other filters", async () => {
      const response = await request(app)
        .get("/products?search=Pro&minPrice=1000")
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("iPad Pro 12.9");
    });

    it("should return no products when search has no matches", async () => {
      const response = await request(app)
        .get("/products?search=Nonexistent")
        .expect(200);

      expect(response.body.data).toHaveLength(0);
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
