import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { AppError } from "../middleware/errorHandler";

// Secret key for JWT signing - should be in environment variables in production
const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "1d";

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "admin" | "user";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterUserInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError("Email already in use", 409);
    }

    // Create new user
    const user = await User.create(userData);

    // Generate JWT token
    // const token = this.generateToken(user);

    return {
      user: {
        id: user._id!.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: "",
    };
  }

  // /**
  //  * Login a user
  //  */
  // async login(credentials: LoginCredentials): Promise<AuthResponse> {
  //   // Find user by email and include password field explicitly
  //   const user = await User.findOne({ email: credentials.email }).select('+password');

  //   // Check if user exists
  //   if (!user) {
  //     throw new Error('Invalid email or password');
  //   }

  //   // Check if password is correct
  //   const isPasswordMatch = await user.comparePassword(credentials.password);
  //   if (!isPasswordMatch) {
  //     throw new Error('Invalid email or password');
  //   }

  //   // Generate JWT token
  //   const token = this.generateToken(user);

  //   return {
  //     user: {
  //       id: user._id!.toString(),
  //       email: user.email,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       role: user.role,
  //     },
  //     token,
  //   };
  // }

  /**
   * Generate JWT token for authenticated user
   */
  // private generateToken(user: IUser): string {
  //   return jwt.sign(
  //     {
  //       id: user._id,
  //       email: user.email,
  //       role: user.role,
  //     },
  //     JWT_SECRET,
  //     {
  //       expiresIn: JWT_EXPIRES_IN,
  //     }
  //   );
  // }

  // /**
  //  * Verify token and return user data
  //  */
  // async verifyToken(token: string): Promise<IUser | null> {
  //   try {
  //     const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  //     const user = await User.findById(decoded.id);
  //     return user;
  //   } catch (error) {
  //     return null;
  //   }
  // }
}

export default new AuthService();
