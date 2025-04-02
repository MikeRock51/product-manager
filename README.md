# Product Manager API

A RESTful API for managing products with authentication, authorization, and media upload capabilities.

## URLs

- **Live API**: [Postman Documentation](https://product-manager-api.onrender.com)
- **API Documentation**: [Postman Documentation](http://35.225.247.91)

## Table of Contents
- [Setup and Installation](#setup-and-installation)
- [Running Tests](#running-tests)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Products](#product-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Setup and Installation

### Prerequisites
- Node.js (v12 or higher)
- MongoDB
- Docker (optional)

### Using Docker
```bash
# Clone the repository
git clone <repository-url>
cd product-manager

# Start the application
docker-compose up -d
```

### Manual Installation
```bash
# Clone the repository
git clone <repository-url>
cd product-manager

# Install dependencies
yarn

# Start the application
yarn start

# For development with hot-reloading
yarn dev
```

## Running Tests

The project uses Jest for testing. To run the tests:

```bash
# Run all tests
yarn test

# Run specific test file
yarn test tests/ProductController.spec.ts

# Run tests in watch mode (for development)
yarn test --watch
```

The tests cover various aspects of the application including:
- Authentication and authorization
- Product management endpoints
- Rate limiting functionality

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the JWT token in the Authorization header of your requests:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Endpoints

#### Register a new user
- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
            "id": "user_id",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "user"
        },
        "token": "jwt_token",
      }
    }
    ```

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "token": "jwt_token",
        "user": {
          "id": "user_id",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "user"
        }
      }
    }
    ```

#### Get Current User Profile
- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user"
      }
    }
    ```

#### Upgrade User to Admin
- **URL**: `/auth/upgrade`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Request body**:
  ```json
  {
    "userId": "user_id_to_upgrade"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "success": true,
      "message": "User role upgraded to admin successfully",
      "data": {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "admin"
      }
    }
    ```

### Product Endpoints

#### Create a Product
- **URL**: `/products`
- **Method**: `POST`
- **Auth required**: Yes
- **Content-Type**: `multipart/form-data`
- **Request body**:
  ```
  name: "Product Name"
  price: 99.99
  description: "Product description here"
  stock: 10
  category: "Electronics"
  tags: ["electronic", "gadget"]
  images: (file1, file2, ...) [up to 10 images]
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "product_id",
        "name": "Product Name",
        "price": 99.99,
        "description": "Product description here",
        "stock": 10,
        "category": "Electronics",
        "tags": ["electronic", "gadget"],
        "images": ["url1", "url2"],
        "vendor": "user_id",
        "createdAt": 1616448000,
        "updatedAt": 1616448000
      }
    }
    ```

#### Get All Products
- **URL**: `/products`
- **Method**: `GET`
- **Auth required**: No
- **Query parameters**:
  - `page` (optional): Page number for pagination
  - `limit` (optional): Number of items per page
  - `category` (optional): Filter by category
  - `tags` (optional): Filter by a list of tags
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "product_id",
          "name": "Product Name",
          "price": 99.99,
          "description": "Product description here",
          "stock": 10,
          "category": "Electronics",
          "tags": ["electronic", "gadget"],
          "images": ["url1", "url2"],
          "vendor": {
            "id": "user_id",
            "firstName": "John",
            "lastName": "Doe",
            "email": "user_email"
          },
          "createdAt": 1616448000,
          "updatedAt": 1616448000
        },
        // More products...
      ]
    }
    ```

#### Get Product by ID
- **URL**: `/products/:id`
- **Method**: `GET`
- **Auth required**: No
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "product_id",
        "name": "Product Name",
        "price": 99.99,
        "description": "Product description here",
        "stock": 10,
        "category": "Electronics",
        "tags": ["electronic", "gadget"],
        "images": ["url1", "url2"],
        "vendor": {
            "id": "user_id",
            "firstName": "John",
            "lastName": "Doe",
            "email": "user_email"
        },
        "createdAt": 1616448000,
        "updatedAt": 1616448000
      }
    }
    ```
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    ```json
    {
      "status": "error",
      "message": "Product not found"
    }
    ```

#### Update a Product
- **URL**: `/products/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **Content-Type**: `multipart/form-data`
- **Request body**:
  ```
  name: "Updated Product Name"
  price: 149.99
  description: "Updated product description"
  stock: 20
  category: "Electronics"
  tags: ["electronic", "gadget", "premium"]
  images: (file1, file2, ...) [up to 10 images]
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "product_id",
        "name": "Updated Product Name",
        "price": 149.99,
        "description": "Updated product description",
        "stock": 20,
        "category": "Electronics",
        "tags": ["electronic", "gadget", "premium"],
        "images": ["url1", "url2"],
        "vendor": "user_id",
        "createdAt": 1616448000,
        "updatedAt": 1616535000
      }
    }
    ```

#### Delete a Product
- **URL**: `/products/:id`
- **Method**: `DELETE`
- **Auth required**: Yes (Admin only)
- **Success Response**:
  - **Code**: 204 No Content

## Error Handling

The API uses consistent error responses:

```json
{
  "status": "error",
  "message": "Error message here",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  }
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Not authorized to perform the action
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15-minute window for authenticated users
