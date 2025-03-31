import request from "supertest";
import { createApp } from "../app/createApp";
import { ProductModel } from "../app/models/Product";

describe("ProductController", () => {
  const app = createApp();

  beforeAll(async () => {
    // await initializeDatabase();
  });

  afterAll(async () => {
    // Cleanup logic if needed
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

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe(newProduct.name);
      expect(response.body.price).toBe(newProduct.price);
      expect(response.body.description).toBe(newProduct.description);
      expect(response.body.stock).toBe(newProduct.stock);

      const savedProduct = await ProductModel.findById(response.body.id);
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

      expect(response.body).toHaveProperty("error");
    });
  });
});
