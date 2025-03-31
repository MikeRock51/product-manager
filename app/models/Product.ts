const mongoose = require("mongoose");


export const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A product must have a name"],
    unique: true,
    trim: true,
    maxlength: [
      40,
      "A product name must have less or equal than 40 characters",
    ],
    minlength: [1, "A product name must have more or equal than 1 character"],
  },

  price: {
    type: Number,
    required: [true, "A product must have a price"],
    min: [0, "A product price must be >= 0"],
  },

  description: {
    type: String,
    required: [true, "A product must have a description"],
    trim: true,
    maxlength: [500, "Product's description must be <= 500 characters"],

  },

  images: {},

  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export interface CreateProductDTO {
  name: string;
  price: number;
  description: string;
  images?: string[];
}

export const ProductModel = mongoose.model("Product", ProductSchema);
