import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),

  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
];

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];