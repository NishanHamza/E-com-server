import DataUriParser from "datauri/parser.js";
import path from "path";
// import { createTransport } from "nodemailer";
import formData from "form-data";
import Mailgun from "mailgun.js";

export const getDataUri = (file) => {
  const parser = new DataUriParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

export const sendToken = async (user, res, message, statusCode) => {
  const token = await user.generateToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      ...cookieOptions,
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    })
    .json({ success: true, message: message });
};

export const cookieOptions = {
  secure: process.env.NODE_ENV === "Development" ? false : true,
  httpOnly: process.env.NODE_ENV === "Development" ? false : true,
  sameSite: process.env.NODE_ENV === "Development" ? false : "none",
};

export const sendEmail = async (subject, to, text) => {
  //API service method

  const mailgun = new Mailgun(formData);
  const client = mailgun.client({
    username: process.env.MAILGUN_USER_NAME,
    key: process.env.MAILGUN_API_KEY,
  });

  const messageData = {
    from: process.env.MAILGUN_USER_MAIL,
    to: to,
    subject: subject,
    text: text,
  };

  client.messages
    .create(process.env.MAILGUN_DOMAIN, messageData)
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.error(err);
    });

  //SMTP METHOD

  // const transporter = createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });

  // await transporter.sendMail({
  //   to,
  //   subject,
  //   text,
  // });
};
