import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../lib/errors";

export function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing required fields: ${missingFields.join(", ")}`);
    }

    next();
  };
}

export function validateQuery(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (req.query[field] === undefined || req.query[field] === null || req.query[field] === "") {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing required query parameters: ${missingFields.join(", ")}`);
    }

    next();
  };
}
