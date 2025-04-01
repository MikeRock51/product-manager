import request from "supertest";
import { createApp } from "../app/createApp";
import User, { UserRole } from "../app/models/User";
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
    // await dropUsers();
  });

  afterAll(async () => {
    await dropUsers();
    await closeDatabase();
  });

  describe("POST /auth/register", () => {
    it("should register a new user and return 201 status", async () => {
      const newUser = {
        email: "tester@example.com",
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

  describe("POST /auth/login", () => {
    it("should login successfully and return user with token", async () => {
      // Create a user first
      const userData = {
        email: "logintest@example.com",
        password: "password123",
        firstName: "Login",
        lastName: "Test"
      };

      await request(app)
        .post("/auth/register")
        .send(userData);

      // Try to login with the created user
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      // Check response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");

      // Check user data in response
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.user.role).toBe("user");

      // Password should not be returned
      expect(response.body.data.user).not.toHaveProperty("password");

      // Verify token is valid
      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwtPayload;
      expect(decoded.email).toBe(userData.email);
    });

    it("should return 401 if email doesn't exist", async () => {
      const loginAttempt = {
        email: "nonexistent@example.com",
        password: "password123"
      };

      const response = await request(app)
        .post("/auth/login")
        .send(loginAttempt)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should return 401 if password is incorrect", async () => {
      // Create a user first
      const userData = {
        email: "wrongpass@example.com",
        password: "correctpassword",
        firstName: "Wrong",
        lastName: "Password"
      };

      await request(app)
        .post("/auth/register")
        .send(userData);

      // Try to login with incorrect password
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: "wrongpassword"
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should return 400 if required fields are missing", async () => {
      // Missing password
      const incompleteLogin = {
        email: "incomplete@example.com"
      };

      const response = await request(app)
        .post("/auth/login")
        .send(incompleteLogin)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it("should verify the JWT token contains correct user information", async () => {
      // Create a user first
      const userData = {
        email: "jwtlogin@example.com",
        password: "password123",
        firstName: "JWT",
        lastName: "Login"
      };

      await request(app)
        .post("/auth/register")
        .send(userData);

      // Login with the created user
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = response.body.data.token;

      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwtPayload;

      expect(decoded.email).toBe(userData.email);
      expect(decoded.role).toBe("user");
      expect(decoded).toHaveProperty("id");

      // Verify the ID matches the database user
      const savedUser = await User.findOne({ email: userData.email });
      expect(decoded.id).toBe(savedUser?._id.toString());
    });
  });

  describe("GET /auth/me", () => {
    it("should return current user profile when authenticated", async () => {
      // Create a user first
      const userData = {
        email: "profile@example.com",
        password: "password123",
        firstName: "Profile",
        lastName: "Test"
      };

      // Register the user to get a token
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      const token = registerResponse.body.data.token;

      // Get profile with token
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Check response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("email", userData.email);
      expect(response.body.data).toHaveProperty("firstName", userData.firstName);
      expect(response.body.data).toHaveProperty("lastName", userData.lastName);
      expect(response.body.data).toHaveProperty("role", "user");
      expect(response.body.data).toHaveProperty("_id");

      // Password should not be returned
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .get("/auth/me")
        .expect(401);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Unauthorized, missing token");
    });

    it("should return 401 when invalid token is provided", async () => {
      const invalidToken = "invalid.token.here";

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.status).toBe("error");
    });

    it("should return 401 when token is for a deleted user", async () => {
      // Create a user first
      const userData = {
        email: "deleted@example.com",
        password: "password123",
        firstName: "Deleted",
        lastName: "User"
      };

      // Register the user to get a token
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      const token = registerResponse.body.data.token;

      // Delete the user from database
      await User.deleteOne({ email: userData.email });

      // Try to get profile with token of deleted user
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Unauthorized, user not found");
    });
  });

  describe("POST /auth/upgrade", () => {
    let adminToken: string;
    let regularUserToken: string;
    let regularUserId: string;
    let anotherUserId: string;

    // Set up users before tests
    beforeAll(async () => {
      // Create an admin user
      const adminUser = await User.create({
        email: "admin.upgrade@example.com",
        password: "adminpass123",
        firstName: "Admin",
        lastName: "User",
        role: UserRole.ADMIN
      });

      // Create token for admin
      const adminPayload: jwtPayload = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role
      };
      adminToken = jwt.sign(adminPayload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

      // Create a regular user
      const regularUser = await User.create({
        email: "regular.upgrade@example.com",
        password: "regularpass123",
        firstName: "Regular",
        lastName: "User",
        role: UserRole.USER
      });

      regularUserId = regularUser._id.toString();

      // Create token for regular user
      const regularPayload: jwtPayload = {
        id: regularUser._id.toString(),
        email: regularUser.email,
        role: regularUser.role
      };
      regularUserToken = jwt.sign(regularPayload, process.env.JWT_SECRET as string, { expiresIn: '1d' });

      // Create another regular user for additional tests
      const anotherUser = await User.create({
        email: "another.upgrade@example.com",
        password: "anotherpass123",
        firstName: "Another",
        lastName: "User",
        role: UserRole.USER
      });

      anotherUserId = anotherUser._id.toString();
    });

    it("should allow an admin to upgrade a regular user to admin", async () => {
      const response = await request(app)
        .post("/auth/upgrade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: regularUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User role upgraded to admin successfully");
      expect(response.body.data).toHaveProperty("role", UserRole.ADMIN);

      // Verify in database
      const updatedUser = await User.findById(regularUserId);
      expect(updatedUser?.role).toBe(UserRole.ADMIN);
    });

    it("should return 403 when a non-admin user tries to upgrade another user", async () => {
      await User.findByIdAndUpdate(regularUserId, { role: UserRole.USER });

      const response = await request(app)
        .post("/auth/upgrade")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({ userId: anotherUserId })
        .expect(403);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Unauthorized");

      // Verify user was not upgraded
      const notUpdatedUser = await User.findById(anotherUserId);
      expect(notUpdatedUser?.role).toBe(UserRole.USER);
    });

    it("should return 400 if userId is not provided", async () => {
      const response = await request(app)
        .post("/auth/upgrade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("User ID is required");
    });

    it("should return 400 if userId is invalid format", async () => {
      const response = await request(app)
        .post("/auth/upgrade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: "invalid-id-format" })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Invalid user ID format");
    });

    it("should return 404 if user to upgrade does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .post("/auth/upgrade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: nonExistentId })
        .expect(404);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("User not found");
    });

    it("should return 400 if trying to upgrade a user who is already admin", async () => {
      // First upgrade the user
      await User.findByIdAndUpdate(regularUserId, { role: UserRole.ADMIN });

      // Try to upgrade again
      const response = await request(app)
        .post("/auth/upgrade")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: regularUserId })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("User is already an admin");
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .post("/auth/upgrade")
        .send({ userId: regularUserId })
        .expect(401);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Unauthorized, missing token");
    });
  });
});