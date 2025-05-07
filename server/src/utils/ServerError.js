class ServerError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ServerError";
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message, details) {
    return new ServerError(400, message, details);
  }
  static unauthorized(message, details) {
    return new ServerError(401, message, details);
  }
  static forbidden(message, details) {
    return new ServerError(403, message, details);
  }
  static notFound(message, details) {
    return new ServerError(404, message, details);
  }

  static conflict(message, details) {
    return new ServerError(409, message, details)
  }

  static internal(message, details) {
    return new ServerError(500, message, details);
  }
}

export default ServerError;