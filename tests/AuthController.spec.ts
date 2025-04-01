import request from "supertest";
import { createApp } from "../app/createApp";
import User from "../app/models/User";
import { closeDatabase, initializeDatabase } from "../app/config/database";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { jwtPayload } from "../app/interfaces/jwtPayload";

// Helper function to clean up users collection before/after tests
async function dropUsers() {
  await User.deleteMany({});
}

describe("AuthController", () => {
  const app = createApp();

  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(async () => {
    await dropUsers();
  });

  afterAll(async () => {
    await dropUsers();
    await closeDatabase();
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return 201 status", async () => {
      const newUser = {
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe"
      };

      const response = await request(app)
        .post("/auth/register")
        .send(newUser)
        .expect(201);

      // Check response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");

      // Check user data in response
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.firstName).toBe(newUser.firstName);
      expect(response.body.data.user.lastName).toBe(newUser.lastName);
      expect(response.body.data.user.role).toBe("user"); // Default role

      // Password should not be returned
      expect(response.body.data.user).not.toHaveProperty("password");

      // Verify token is valid
      const token = response.body.data.token;
      expect(typeof token).toBe("string");

      // Verify user was actually saved in database
      const savedUser = await User.findOne({ email: newUser.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.email).toBe(newUser.email);
      expect(savedUser?.firstName).toBe(newUser.firstName);
      expect(savedUser?.lastName).toBe(newUser.lastName);

      // Password should be hashed
      expect(savedUser?.password).not.toBe(newUser.password);
    });

    it("should return 409 if email is already in use", async () => {
      // Create a user first
      const existingUser = {
        email: "existing@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Doe"
      };

      await User.create(existingUser);

      // Try to register with the same email
      const response = await request(app)
        .post("/auth/register")
        .send(existingUser)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe("Email already in use");
    });

    it("should return 400 if required fields are missing", async () => {
      // Missing lastName
      const incompleteUser = {
        email: "incomplete@example.com",
        password: "password123",
        firstName: "Incomplete"
      };

      const response = await request(app)
        .post("/auth/register")
        .send(incompleteUser)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it("should return 400 if email format is invalid", async () => {
      const invalidEmailUser = {
        email: "notanemail",
        password: "password123",
        firstName: "Invalid",
        lastName: "Email"
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it("should return 400 if password is too short", async () => {
      const shortPasswordUser = {
        email: "valid@example.com",
        password: "12345",
        firstName: "Short",
        lastName: "Password"
      };

      const response = await request(app)
        .post("/auth/register")
        .send(shortPasswordUser)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it("should not set user role if provided", async () => {
      const adminUser = {
        email: "admin@example.com",
        password: "adminpass123",
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      };

      const response = await request(app)
        .post("/auth/register")
        .send(adminUser)
        .expect(201);

      expect(response.body.data.user.role).toBe("user");

      // Verify in database
      const savedUser = await User.findOne({ email: adminUser.email });
      expect(savedUser?.role).toBe("user");
    });

    it("should verify the JWT token contains correct user information", async () => {
      const newUser = {
        email: "jwt@example.com",
        password: "password123",
        firstName: "JWT",
        lastName: "Test"
      };

      const response = await request(app)
        .post("/auth/register")
        .send(newUser)
        .expect(201);

      const token = response.body.data.token;

      // Decode the token (note: in a real test we might mock this or use a test secret)
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwtPayload;

      expect(decoded.email).toBe(newUser.email);
      expect(decoded.role).toBe("user");
      expect(decoded).toHaveProperty("id");

      // Verify the ID matches the database user
      const savedUser = await User.findOne({ email: newUser.email });
      expect(decoded.id).toBe(savedUser?._id.toString());
    });
  });
});