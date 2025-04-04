import mongoose, { ObjectId } from "mongoose";


export interface IProduct {
  _id?: ObjectId;
  name: string;
  price: number;
  description: string;
  stock: number;
  category?: string;
  tags: string[];
  images: string[];
  vendor: ObjectId;
  createdAt: number;
  updatedAt: number;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      unique: true,
      trim: true,
      maxlength: [
        50,
        "A product name must have less or equal than 50 characters",
      ],
      minlength: [2, "A product name must have more or equal than 2 character"],
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
      maxlength: [1000, "Product's description must be <= 1000 characters"],
    },

    stock: {
      type: Number,
      default: 1,
    },

    category: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    images: {
      type: [String],
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A product must have a vendor"],
    },

    createdAt: {
      type: Number,
    },

    updatedAt: {
      type: Number,
    },
  },
  {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) },
  }
);

export interface CreateProductDTO {
  name: string;
  price: number;
  description: string;
  stock?: number;
  category?: string;
  tags?: string[];
  images?: string[];
}

ProductSchema.pre(/^find/, function(next) {
  (this as mongoose.Query<any, any>).populate({
    path: 'vendor',
    select: 'firstName lastName email',
  });
  next();
});


export const ProductModel = mongoose.model("Product", ProductSchema);
