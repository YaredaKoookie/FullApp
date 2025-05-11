import express from "express";
import cors from "cors";
import { errorHandler, requestLogger, clientInfo } from "./middlewares";
import cookie from "cookie-parser";
import routes from "./routes";
import { env } from "./config";
import path from "path"

const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);


app.use(express.static(path.resolve(__dirname, "../public")));
app.use(cookie());

// custom middleware
app.use(clientInfo()); 
app.use(requestLogger());

// routes
app.use("/", routes);
app.use(errorHandler.handleNotFound);
app.use(errorHandler.globalErrorHandler);

export default app;
