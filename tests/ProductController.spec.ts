import request from "supertest";
import { createApp } from "../app/createApp";
import { ProductModel } from "../app/models/Product";
import { closeDatabase, initializeDatabase } from "../app/config/database";

describe("ProductController", () => {
  const app = createApp();

  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await ProductModel.deleteMany({});
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

    it("should create a new product with images and return 201 status", async () => {
      const newProductWithImages = {
        name: "Test Product with Images",
        price: 150,
        description: "A test product with images",
        stock: 30,
      };

      const mockImages = [Buffer.from("mockImage1"), Buffer.from("mockImage2")];

      const response = await request(app)
        .post("/products")
        .field("name", newProductWithImages.name)
        .field("price", newProductWithImages.price)
        .field("description", newProductWithImages.description)
        .field("stock", newProductWithImages.stock)
        .attach("images", mockImages[0], "image1.jpg")
        .attach("images", mockImages[1], "image2.jpg")
        .expect(201);

      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.name).toBe(newProductWithImages.name);
      expect(response.body.data.price).toBe(newProductWithImages.price);
      expect(response.body.data.description).toBe(newProductWithImages.description);
      expect(response.body.data.stock).toBe(newProductWithImages.stock);
      expect(response.body.data.images).toHaveLength(2);

      const savedProduct = await ProductModel.findById(response.body.data._id);
      expect(savedProduct).not.toBeNull();
      expect(savedProduct?.images).toHaveLength(2);
    });
  });
});
