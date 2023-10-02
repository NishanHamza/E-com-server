import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name."],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email."],
    unique: [true, "Email already Exist."],
    validate: validator.isEmail,
  },
  password: {
    type: String,
    required: [true, "Please Enter Your Password."],
    minLength: [6, "Password must be at least 6 characters long"],
  },
  address: {
    type: String,
    required: [true],
  },
  city: {
    type: String,
    required: [true],
  },
  country: {
    type: String,
    required: [true],
  },

  pinCode: {
    type: Number,
    required: [true],
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  avater: {
    public_id: String,
    url: String,
  },
  otp: Number,
  otp_expire: Date,
});

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

schema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

schema.methods.generateToken = async function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

export const User = mongoose.model("User", schema);
