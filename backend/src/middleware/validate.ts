import { Request, Response, NextFunction } from "express";
import { Schema } from "zod";

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      const validationError = error as any;
      res.status(400).json({
        error: "Validation failed",
        message: validationError.errors?.[0]?.message || "Invalid input data",
      });
    }
  };
};
