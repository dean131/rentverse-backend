import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import AppError from "../shared/utils/AppError.js";

type DataSource = "body" | "query" | "params";

const validate =
  (schema: ZodType, source: DataSource = "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const parsedData = await schema.parseAsync(data);

      if (source === "body") {
        req.body = parsedData;
      } else {
        // Safe mutation for query/params
        Object.assign(req[source], parsedData);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        return next(new AppError(`Validation Error: ${errorMessage}`, 400));
      }
      next(error);
    }
  };

export default validate;