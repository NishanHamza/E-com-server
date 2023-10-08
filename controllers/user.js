import { asyncError, errorMiddleware } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/error.js";
import {
  cookieOptions,
  getDataUri,
  sendEmail,
  sendToken,
} from "../utils/feature.js";
import cloudinary from "cloudinary";

export const login = asyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Incorrect Email Or Password", 400));

  if (!password) return next(new ErrorHandler("Please Enter Password", 400));

  const isMatched = await user.comparePassword(password);

  if (!isMatched) {
    return next(new ErrorHandler("Incorrect email and password", 400));
  }

  sendToken(user, res, `Welcome Back ${user.name}`, 200);
});

export const signup = asyncError(async (req, res, next) => {
  const { name, email, password, address, city, country, pinCode } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("User Already Exist", 400));
  }

  let avater = undefined;

  if (req.file) {
    const file = getDataUri(req.file);
    const myCloud = await cloudinary.v2.uploader.upload(file.content);
    avater = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  user = await User.create({
    avater,
    name,
    email,
    password,
    address,
    city,
    country,
    pinCode,
  });

  sendToken(user, res, `Registered Succesfully`, 201);
});

export const logout = asyncError(async (req, res) => {
  res
    .status(200)
    .cookie("token", "", {
      ...cookieOptions,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Successfully Logged Out",
    });
});

export const getMyProfile = asyncError(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = asyncError(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { name, email, address, country, city, pinCode } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (address) user.address = address;
  if (country) user.country = country;
  if (city) user.city = city;
  if (pinCode) user.pinCode = pinCode;

  user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

export const changePassword = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(
      new ErrorHandler("Please Enter Old Password And New Password", 400)
    );

  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) return next(new ErrorHandler("Incorrect Old Password", 400));

  user.password = newPassword;

  user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Succesfully",
  });
});

export const updatePic = asyncError(async (req, res) => {
  const user = await User.findById(req.user._id);

  const file = getDataUri(req.file);

  await cloudinary.v2.uploader.destroy(user.avater.public_id);

  const myCloud = await cloudinary.v2.uploader.upload(file.content);

  user.avater = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };
  await user.save();

  res.status(200).json({
    success: true,
    message: "Avater Updated Successfully.",
  });
});

export const forgetpassword = asyncError(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("Incorrect Email.", 404));

  const randomNumber = Math.random() * (999999 - 100000) + 100000;

  const otp = Math.floor(randomNumber);
  const otp_expire = 15 * 60 * 1000;

  user.otp = otp;
  user.otp_expire = new Date(Date.now() + otp_expire);

  await user.save();

  const message = `your otp for reseting password is ${otp}, \n please ignore if you haven't requested this.`;

  try {
    sendEmail("OTP for reseting password", user.email, message);
  } catch (error) {
    user.otp = null;
    user.otp_expire = null;
    await user.save();
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: `Email send to ${user.email}`,
  });
});

export const resetpassword = asyncError(async (req, res) => {
  const { otp, password } = req.body;

  const user = await User.findOne({
    otp,
    otp_expire: {
      $gt: Date.now(),
    },
  });
  if (!user) {
    return next(new ErrorHandler("Incorrect OTP OR has been expired", 400));
  }
  if (!password) return next(new ErrorHandler("Enter new password.", 400));

  user.password = password;
  user.otp = undefined;
  user.otp_expire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed succesfully, you can log in now.",
  });
});
