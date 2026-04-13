import { ZodError } from "zod";

// Middleware to validate request data using Zod schemas

export const validate = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors.map((item) => ({
          path: item.path.join("."),
          message: item.message,
        })),
      });
    }

    next(error);
  }
};