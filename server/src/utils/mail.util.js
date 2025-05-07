import { env } from "../config";
import { compilePug, inlineCssStyles } from "./mailPlugins";
import { htmlToText } from "nodemailer-html-to-text";
import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";


// const transporter = nodemailer.createTransport(MailtrapTransport({
//   token: env.MAIL_TOKEN
// }));

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  auth: {
    user: env.MAIL_USERNAME,
    pass: env.MAIL_PASSWORD,
  },
})

transporter.use("compile", compilePug());
transporter.use("compile", inlineCssStyles());
transporter.use("compile", htmlToText());
export default transporter;