import express from "express";
import cors from "cors";
import { errorHandler, requestLogger, clientInfo } from "./middlewares";
import cookie from "cookie-parser";
import routes from "./routes";
import { env } from "./config";
import path from "path"

const app = express();
const allowedOrigins = [env.FRONTEND_URL, "http://localhost:5174", "http://localhost:5173","http://localhost:5175"];
    console.log(env)
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
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
