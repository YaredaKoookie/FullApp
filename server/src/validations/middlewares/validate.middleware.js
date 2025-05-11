import { validationResult, matchedData,  } from "express-validator";
import { logger, ServerError } from "../../utils";

const validate = (validations, options = { matchData: true }) =>
  async (req, res, next) => {
    console.log("middleware body", req.body)
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log('errors', errors)
      const error = new ServerError("ValidationError");
      error.name = "ValidationError"; // Explicitly set the error name
      logger.debug(error.name);
      error.statusCode = 400;
      error.details = errors.array().map((err) => ({
      path: err.param,
      message: err.msg,
      }));

      return next(error);
    }

    if (options.matchData) req.body = matchedData(req);

    next();
};

export default validate;
