import { asyncError } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { Category } from "../models/category.js";
import ErrorHandler from "../utils/error.js";
import { getDataUri } from "../utils/feature.js";
import cloudinary from "cloudinary";

export const getAllProducts = asyncError(async (req, res, next) => {
  const { category, keyword } = req.query;

  const products = await Product.find({
    name: {
      $regex: keyword ? keyword : "",
      $options: "i",
    },
    ...(category ? { category } : {}),
  });

  res.status(200).json({
    success: true,
    products,
  });
});

export const getAdminProducts = asyncError(async (req, res, next) => {
  const products = await Product.find({}).populate("category");

  const outOfStock = products.filter((i) => i.stock == 0);

  res.status(200).json({
    success: true,
    products,
    outOfStock: outOfStock.length,
    inStock: products.length - outOfStock.length,
  });
});

export const getProductDetails = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) return next(new ErrorHandler("Product not Found", 404));

  res.status(200).json({
    success: true,
    product,
  });
});

export const createProduct = asyncError(async (req, res, next) => {
  const { name, description, price, stock, category } = req.body;

  if (!req.file) return next(new ErrorHandler("Please Add Image", 400));

  const file = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(file.content);
  const image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await Product.create({
    name,
    price,
    stock,
    category,
    images: [image],
    description,
  });

  res.status(200).json({
    success: true,
    message: "Product Created Successfully",
  });
});

export const updateProduct = asyncError(async (req, res, next) => {
  const { name, description, price, stock, category } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not Found", 404));

  if (name) product.name = name;
  if (description) product.description = description;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

export const addProductImage = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not Found", 404));

  if (!req.file) return next(new ErrorHandler("Please Add Image", 400));

  const file = getDataUri(req.file);
  const myCloud = await cloudinary.v2.uploader.upload(file.content);
  const image = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  product.images.push(image);

  await product.save();

  res.status(200).json({
    success: true,
    message: "image added Successfully",
  });
});

export const deleteProductImage = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not Found", 404));

  const id = req.query.id;

  if (!id) return next(new ErrorHandler("Please Enter Image id", 400));

  let isExist = -1;

  product.images.forEach((item, index) => {
    if (item._id.toString() === id.toString()) isExist = index;
  });

  if (isExist < 0) return next(new ErrorHandler("Image Doesn't Exist", 400));

  await cloudinary.v2.uploader.destroy(product.images[isExist]).public_id;

  product.images.splice(isExist, 1);

  await product.save();

  res.status(200).json({
    success: true,
    message: "image deleted Successfully",
  });
});

export const deleteProduct = asyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not Found", 404));

  for (let index = 0; index < product.images.length; index++) {
    await cloudinary.v2.uploader.destroy(product.images[index]).public_id;
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const addCategory = asyncError(async (req, res, next) => {
  await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: "Category Added Successfully",
  });
});

export const getAllCategory = asyncError(async (req, res, next) => {
  const categories = await Category.find({});

  res.status(200).json({
    success: true,
    categories,
  });
});

export const deleteCategory = asyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) return next(new ErrorHandler("Category Not Found", 404));

  const products = await Product.find({ category: category._id });

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    product.category = undefined;
    await product.save();
  }
  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category Deleted Successfully",
  });
});
