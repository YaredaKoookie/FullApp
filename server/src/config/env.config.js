import dotenv from "dotenv";
import { cleanEnv, port, str, url, email } from "envalid";
dotenv.config();
const env = cleanEnv(process.env, {
  PORT: port({
    default: 3000,
  }),
  DB_URL: url(),
  MAGIC_LINK_SECRET: str(),
  MAIL_HOST: str(),
  MAIL_PORT: port(),
  MAIL_USERNAME: str(),
  MAIL_PASSWORD: str(),
  MAIL_FROM: email(),
  MAIL_SEND_HOST: str(),
  MAIL_SEND_PORT: port(),
  MAIL_SEND_USERNAME: str(),
  MAIL_SEND_PASSWORD: str(),
  MAIL_SEND_FROM: email(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_PARTIAL_SECRET: str(),
  JWT_ONETIME_CODE_SECRET: str(),
  FRONTEND_URL: url(),
  MAIL_TOKEN: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GOOGLE_CALLBACK_URL: url(),
  SERVER_URL: url(),
  CHAPA_SECRET_KEY: str(),
  NODE_ENV: str({
    choices: ["production", "development"],
    default: "development",
  }),
});
export default env;
