import { Request, Response } from "express";
import notificationService from "./notification.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import {
  sendInfiniteList,
  sendSuccess,
} from "../../shared/utils/response.helper.js";

class NotificationController {
  registerDevice = catchAsync(async (req: Request, res: Response) => {
    const result = await notificationService.registerDevice(
      req.user!.id,
      req.body
    );
    return sendSuccess(res, result, "Device registered successfully");
  });

  // Get History
  list = catchAsync(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor as string;

    const notifications = await notificationService.getUserNotifications(
      req.user!.id,
      limit,
      cursor
    );

    // Manual pagination meta calculation
    let nextCursor: string | null = null;
    if (notifications.length === limit) {
      nextCursor = notifications[notifications.length - 1].id;
    }

    return sendInfiniteList(res, notifications, {
      limit,
      total: 0, // Optional or expensive to count
      nextCursor,
      hasMore: !!nextCursor,
    });
  });

  // Mark Read
  markRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await notificationService.markAsRead(req.user!.id, id);
    return sendSuccess(res, null, "Notification marked as read");
  });
}

export default new NotificationController();
