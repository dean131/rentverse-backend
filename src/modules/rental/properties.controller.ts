import { Request, Response } from "express";
import propertiesService from "./properties.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import AppError from "../../shared/utils/AppError.js";
import {
  sendSuccess,
  sendInfiniteList,
} from "../../shared/utils/response.helper.js";

class PropertiesController {
  create = catchAsync(async (req: Request, res: Response) => {
    // Files are available in req.files
    const files = req.files as Express.Multer.File[];

    // Auth Middleware ensures req.user exists
    const result = await propertiesService.createProperty(
      req.user!.id,
      req.body,
      files
    );

    return sendSuccess(res, result, "Property listed successfully", 201);
  });

  /**
   * Public List with Infinite Scroll
   */
  getAll = catchAsync(async (req: Request, res: Response) => {
    // Service now returns { data, meta }
    const { data, meta } = await propertiesService.getAllProperties(req.query);

    return sendInfiniteList(
      res,
      data,
      meta,
      "Properties retrieved successfully"
    );
  });

  /**
   * Public Detail
   */
  getOne = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const property = await propertiesService.getPropertyById(id);

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    return sendSuccess(
      res,
      property,
      "Property details retrieved successfully"
    );
  });
}

export default new PropertiesController();
