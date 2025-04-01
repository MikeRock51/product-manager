import request from "supertest";
import { createApp } from "../app/createApp";
import { ProductModel } from "../app/models/Product";
import { closeDatabase, initializeDatabase } from "../app/config/database";
import mongoose from "mongoose";
import User, { UserRole } from "../app/models/User";
import AuthService from "../app/services/AuthService";

async function dropProducts() {
  await ProductModel.deleteMany({});
}

async function dropUsers() {
  await User.deleteMany({});
}

describe("ProductController", () => {
  const app = createApp();
  let authToken: string;
  let testUser: any;
  let adminToken: string;
  let adminUser: any;

  beforeAll(async () => {
    await initializeDatabase();

    // Create test user for authentication
    const userData = {
      email: "test123@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    };

    const authResponse = await AuthService.register(userData);
    authToken = authResponse.token;
    testUser = authResponse.user;

    adminUser = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "adminuser@email.com",
      password: "adminpassword",
      role: UserRole.ADMIN,
    })

    const adminAuthResponse = await AuthService.login({
      email: adminUser.email,
      password: "adminpassword",
    });

    adminToken = adminAuthResponse.token;
  });

  beforeEach(async () => {
    await dropProducts();
  });

  afterAll(async () => {
    await dropProducts();
    await dropUsers();
    await closeDatabase();
  });

  describe("POST /products", () => {
    it("should create a new product and return 201 status", async () => {
      const newProduct = {
        name: "Test Product",
        price: 100,
        description: "A test product description",
        stock: 50,
        category: "Electronics",
        tags: ["gadget", "tech"],
        vendor: testUser.id,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      newProduct.category = newProduct.category.toLowerCase();

      expect(response.body.data.name).toBe(newProduct.name);
      expect(response.body.data.price).toBe(newProduct.price);
      expect(response.body.data.description).toBe(newProduct.description);
      expect(response.body.data.stock).toBe(newProduct.stock);
      expect(response.body.data.category).toBe(newProduct.category);
      expect(response.body.data.tags).toEqual(newProduct.tags);
      expect(response.body.data.vendor).toBe(testUser.id);

      const savedProduct = await ProductModel.findById(response.body.data._id);
      expect(savedProduct).not.toBeNull();
      expect(savedProduct?.name).toBe(newProduct.name);
      expect(savedProduct?.category).toBe(newProduct.category);
      expect(savedProduct?.tags).toEqual(newProduct.tags);
      expect(savedProduct?.vendor.toString()).toBe(testUser.id);
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteProduct = {
        price: 100,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(incompleteProduct)
        .expect(400);

      expect(response.body.status).toBe("error");
    });

    it("should return 401 if authentication token is not provided", async () => {
      const newProduct = {
        name: "Test Product",
        price: 100,
        description: "A test product description",
        stock: 50,
        category: "Electronics",
        tags: ["gadget", "tech"],
        vendor: testUser.id,
      };

      const response = await request(app)
        .post("/products")
        .send(newProduct)
        .expect(401);

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
        vendor: testUser.id,
      });

      const response = await request(app)
        .get(`/products/${product._id}`)
        .expect(200);

      expect(response.body.data).toHaveProperty("_id", product._id.toString());
      expect(response.body.data.name).toBe(product.name);
      expect(response.body.data.price).toBe(product.price);
      expect(response.body.data.description).toBe(product.description);
      expect(response.body.data.stock).toBe(product.stock);
      expect(response.body.data.vendor).toBe(testUser.id);
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
          vendor: testUser.id,
        },
        {
          name: "Product 2",
          price: 200,
          description: "Description for product 2",
          stock: 20,
          vendor: testUser.id,
        },
      ]);

      const response = await request(app)
        .get("/products")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty("name", "Product 1");
      expect(response.body.data[1]).toHaveProperty("name", "Product 2");
      expect(response.body.data[0].vendor).toBe(testUser.id);
      expect(response.body.data[1].vendor).toBe(testUser.id);
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
          vendor: testUser.id,
        },
        {
          name: "Product 2",
          price: 200,
          description: "Description for product 2",
          stock: 20,
          vendor: testUser.id,
        },
        {
          name: "Product 3",
          price: 300,
          description: "Description for product 3",
          stock: 30,
          vendor: testUser.id,
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
      await ProductModel.create([
        {
          name: "Budget Product",
          price: 25,
          description: "A low-cost product",
          stock: 5,
          vendor: testUser.id,
        },
        {
          name: "Mid-range Product",
          price: 100,
          description: "A mid-range product",
          stock: 15,
          vendor: testUser.id,
        },
        {
          name: "Premium Product",
          price: 500,
          description: "A high-end product",
          stock: 3,
          vendor: testUser.id,
        },
        {
          name: "Luxury Product",
          price: 1000,
          description: "A luxury product",
          stock: 0,
          vendor: testUser.id,
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
      await request(app)
        .get("/products?minPrice=invalid&maxPrice=alsoinvalid")
        .expect(400);
    });
  });

  describe("GET /products with search", () => {
    beforeEach(async () => {
      await ProductModel.create([
        {
          name: "iPhone 13 Pro",
          price: 999,
          description: "Apple smartphone",
          stock: 10,
          vendor: testUser.id,
        },
        {
          name: "Samsung Galaxy S21",
          price: 799,
          description: "Samsung smartphone",
          stock: 15,
          vendor: testUser.id,
        },
        {
          name: "Google Pixel 6",
          price: 699,
          description: "Google smartphone",
          stock: 8,
          vendor: testUser.id,
        },
        {
          name: "iPad Pro 12.9",
          price: 1099,
          description: "Apple tablet",
          stock: 5,
          vendor: testUser.id,
        },
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

  describe("GET /products with category and tags filters", () => {
    beforeEach(async () => {
      await ProductModel.create([
        {
          name: "iPhone 13 Pro",
          price: 999,
          description: "Apple smartphone",
          stock: 10,
          category: "smartphones",
          tags: ["apple", "ios", "mobile"],
          vendor: testUser.id,
        },
        {
          name: "Samsung Galaxy S21",
          price: 799,
          description: "Samsung smartphone",
          stock: 15,
          category: "smartphones",
          tags: ["samsung", "android", "mobile"],
          vendor: testUser.id,
        },
        {
          name: "Google Pixel 6",
          price: 699,
          description: "Google smartphone",
          stock: 8,
          category: "smartphones",
          tags: ["google", "android", "mobile"],
          vendor: testUser.id,
        },
        {
          name: "iPad Pro 12.9",
          price: 1099,
          description: "Apple tablet",
          stock: 5,
          category: "tablets",
          tags: ["apple", "ios", "tablet"],
          vendor: testUser.id,
        },
        {
          name: "MacBook Pro",
          price: 1999,
          description: "Apple laptop",
          stock: 7,
          category: "laptops",
          tags: ["apple", "macos", "laptop"],
          vendor: testUser.id,
        },
      ]);
    });

    it("should filter products by category", async () => {
      const response = await request(app)
        .get("/products?category=smartphones")
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe("smartphones");
      });
    });

    it("should filter products by tags", async () => {
      const response = await request(app)
        .get("/products?tags=apple")
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach((product: any) => {
        expect(product.tags).toContain("apple");
      });
    });

    it("should filter products by multiple tags", async () => {
      const response = await request(app)
        .get("/products?tags=android&tags=mobile")
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach((product: any) => {
        expect(product.tags.some((tag: string) => ["android", "mobile"].includes(tag))).toBe(true);
      });
    });

    it("should combine category and tags filters", async () => {
      const response = await request(app)
        .get("/products?category=smartphones&tags=android")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe("smartphones");
        expect(product.tags).toContain("android");
      });
    });

    it("should combine category and price filters", async () => {
      const response = await request(app)
        .get("/products?category=smartphones&minPrice=800")
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("iPhone 13 Pro");
      expect(response.body.data[0].category).toBe("smartphones");
      expect(response.body.data[0].price).toBe(999);
    });
  });

  describe("PUT /products/:id", () => {
    it("should update a product successfully", async () => {
      const product = await ProductModel.create({
        name: "Existing Product",
        price: 200,
        description: "An existing product description",
        stock: 20,
        vendor: testUser.id,
      });

      const updatedProductData = {
        name: "Updated Product",
        price: 250,
      };

      const response = await request(app)
        .put(`/products/${product._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatedProductData)
        .expect(200);

      expect(response.body.data).toHaveProperty("_id", product._id.toString());
      expect(response.body.data.name).toBe(updatedProductData.name);
      expect(response.body.data.price).toBe(updatedProductData.price);
      expect(response.body.data.vendor).toBe(testUser.id);

      const updatedProduct = await ProductModel.findById(product._id);
      expect(updatedProduct).not.toBeNull();
      expect(updatedProduct?.name).toBe(updatedProductData.name);
      expect(updatedProduct?.price).toBe(updatedProductData.price);
      expect(updatedProduct?.vendor.toString()).toBe(testUser.id);
    });

    it("should update a product's category and tags successfully", async () => {
      const product = await ProductModel.create({
        name: "Existing Product",
        price: 200,
        description: "An existing product description",
        stock: 20,
        category: "Miscellaneous",
        tags: ["test"],
        vendor: testUser.id,
      });

      const updatedProductData = {
        category: "Electronics",
        tags: ["gadget", "tech", "sale"],
      };

      const response = await request(app)
        .put(`/products/${product._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatedProductData)
        .expect(200);

      updatedProductData.category = updatedProductData.category.toLowerCase();
      expect(response.body.data).toHaveProperty("_id", product._id.toString());
      expect(response.body.data.category).toBe(updatedProductData.category);
      expect(response.body.data.tags).toEqual(updatedProductData.tags);

      const updatedProduct = await ProductModel.findById(product._id);
      expect(updatedProduct).not.toBeNull();
      expect(updatedProduct?.category).toBe(updatedProductData.category);
      expect(updatedProduct?.tags).toEqual(updatedProductData.tags);
    });

    it("should return 404 if the product is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/products/${nonExistentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated Product" })
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Product not found");
    });

    it("should return 401 if authentication token is not provided", async () => {
      const product = await ProductModel.create({
        name: "Existing Product",
        price: 200,
        description: "An existing product description",
        stock: 20,
        vendor: testUser.id,
      });

      const response = await request(app)
        .put(`/products/${product._id}`)
        .send({ name: "Updated Name" })
        .expect(401);

      expect(response.body.status).toBe("error");
    });
  });

  describe("DELETE /products/:id", () => {
    it("should delete a product successfully", async () => {
      const product = await ProductModel.create({
        name: "Product to Delete",
        price: 150,
        description: "This product will be deleted",
        stock: 10,
        vendor: testUser.id,
      });

      const response = await request(app)
        .delete(`/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204);

      const deletedProduct = await ProductModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it("should return 404 if the product to delete is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/products/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Product not found");
    });

    it("should return 401 if authentication token is not provided", async () => {
      const product = await ProductModel.create({
        name: "Product to Delete",
        price: 150,
        description: "This product will be deleted",
        stock: 10,
        vendor: testUser.id,
      });

      const response = await request(app)
        .delete(`/products/${product._id}`)
        .expect(401);

      expect(response.body.status).toBe("error");
    });

    it("should return 403 if user is not the product vendor", async () => {
      // Create a different user
      const anotherUserData = {
        email: "anotheruser@example.com",
        password: "password456",
        firstName: "Another",
        lastName: "User",
      };
      const anotherAuthResponse = await AuthService.register(anotherUserData);
      const anotherAuthToken = anotherAuthResponse.token;
      const anotherUser = anotherAuthResponse.user;

      // Create product with the original test user as vendor
      const product = await ProductModel.create({
        name: "Product with Different Vendor",
        price: 200,
        description: "This product has a specific vendor",
        stock: 15,
        vendor: testUser.id, // Original test user is the vendor
      });

      // Try to delete the product with the other user
      const response = await request(app)
        .delete(`/products/${product._id}`)
        .set("Authorization", `Bearer ${anotherAuthToken}`) // Use the other user's token
        .expect(403);

      // Verify the error message
      expect(response.body.status).toBe("error");

      // Verify the product was not deleted
      const productStillExists = await ProductModel.findById(product._id);
      expect(productStillExists).not.toBeNull();
    });
  });
});
