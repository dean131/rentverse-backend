import { Request, Response } from "express";
import chatService from "./chat.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess, sendInfiniteList } from "../../shared/utils/response.helper.js";

class ChatController {
  start = catchAsync(async (req: Request, res: Response) => {
    // Inputs validated by middleware
    const { propertyId } = req.body;
    const result = await chatService.startChat(req.user!.id, propertyId);
    
    return sendSuccess(res, result, "Conversation started", 201);
  });

  list = catchAsync(async (req: Request, res: Response) => {
    // Pass query params (limit, cursor) to service
    const { data, meta } = await chatService.getMyConversations(req.user!.id, req.user!.role, req.query);
    
    return sendInfiniteList(res, data, meta, "Conversations retrieved");
  });

  messages = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    // Pass query params (limit, cursor) to service
    const { data, meta } = await chatService.getRoomMessages(roomId, req.user!.id, req.query);
    
    return sendInfiniteList(res, data, meta, "Messages retrieved");
  });
}

export default new ChatController();