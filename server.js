import { app } from "./app.js";
import { connectDB } from "./data/database.js";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_API_SECRET);

connectDB();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(process.env.PORT, () => {
  console.log(
    `Server Started At port: ${process.env.PORT}, in ${process.env.NODE_ENV} Mode`
  );
});
