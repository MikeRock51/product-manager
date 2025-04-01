import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';

class AuthControllerClass {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }

  // /**
  //  * Login a user
  //  */
  // async login(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { email, password } = req.body;

  //     const result = await AuthService.login({
  //       email,
  //       password
  //     });

  //     res.status(200).json({
  //       success: true,
  //       data: result
  //     });
  //   } catch (error: any) {
  //     if (error.message === 'Invalid email or password') {
  //       return res.status(401).json({
  //         success: false,
  //         message: error.message
  //       });
  //     }
  //     next(error);
  //   }
  // }

  // /**
  //  * Get current user profile
  //  */
  // async getProfile(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     // The user object is attached by the auth middleware
  //     const user = req.user;

  //     res.status(200).json({
  //       success: true,
  //       data: user
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }
}

export const AuthController = new AuthControllerClass();