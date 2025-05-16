import { logger, ServerError } from "../utils";
import { env } from "../config";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export function handleNotFound(req, res, next) {
  next(ServerError.notFound("Not Found", "NOT_FOUND"));
}
export function globalErrorHandler(err, req, res, next) {
  let message = err.message;
  let statusCode = err.statusCode || 500;

  if (err instanceof JsonWebTokenError) {
    message = "Invalid token";
    statusCode = 401;
  }

  if (err instanceof TokenExpiredError) {
    message = "Invalid expired";
    statusCode = 401;
  }

  if(err.name === "ValidationError"){
     message = "Validation Error"
     statusCode = 400;
  }


  logger.error("Error", err);

  res.status(statusCode || 500).format({
    "application/json": () => {
      res.json({
        success: false,
        message: message || "Something went wrong",
        details: err?.details || undefined,
        stack: env.isDev ? err.stack : undefined,
      });
    },
    "text/plain": () => {
      res.send(
        `Error: ${message}\nCode: ${err.code || "INTERNAL_SERVER_ERROR"}\n${
          env.isDev ? err.stack : ""
        }`
      );
    },
    "text/html": () => {
      res.send(`
        <html>
          <body>
        <h1>Error</h1>
        <p><strong>Message:</strong> ${message}</p>
        ${
          env.isDev
            ? `<pre>${err.stack.replace(
                /DAP[\\/]+server[\\/]+src[\\/]+(?:.*[\\/])?([^\\/]+\.js)(?=:\d+:\d+)/g,
                "<mark>$1</mark>"
              )}</pre>`
            : ""
        }
          </body>
        </html>
      `);
    },
  });
}
