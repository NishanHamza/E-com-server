import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/error.js";
import { asyncError } from "./error.js";
import { User } from "../models/user.js";

export const isAuthenticated = asyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Not Logged in", 401));
  }

  const decodeToken = jwt.decode(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodeToken._id);

  next();
});

export const isAdmin = asyncError(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ErrorHandler("Only Admin allowed", 401));
  }

  next();
});
