import { Request, Response } from "express";
import landlordService from "./landlord.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess, sendInfiniteList } from "../../shared/utils/response.helper.js";

class LandlordController {
  getDashboard = catchAsync(async (req: Request, res: Response) => {
    const stats = await landlordService.getDashboard(req.user!.id);
    return sendSuccess(res, stats, "Dashboard retrieved successfully");
  });

  // [NEW] Inventory Handler
  getProperties = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await landlordService.getInventory(req.user!.id, req.query);
    return sendInfiniteList(res, data, meta, "Inventory retrieved successfully");
  });
}

export default new LandlordController();