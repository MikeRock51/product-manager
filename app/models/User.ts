import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongoose';


export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
export interface IUser {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Number;
  updatedAt: Number;
}


const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },

    createdAt: {
      type: Number,
    },

    updatedAt: {
      type: Number,
    }
  },
  {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this;

  // Only hash the password if it's modified (or new)
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

const User = mongoose.model('User', userSchema);

export default User;