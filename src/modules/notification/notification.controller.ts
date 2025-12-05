import { Request, Response } from "express";
import notificationService from "./notification.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess } from "../../shared/utils/response.helper.js";

class NotificationController {
  registerDevice = catchAsync(async (req: Request, res: Response) => {
    // req.user is provided by verifyToken middleware
    const result = await notificationService.registerDevice(req.user!.id, req.body);
    return sendSuccess(res, result, "Device registered successfully");
  });
}

export default new NotificationController();