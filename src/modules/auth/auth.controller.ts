import { Request, Response } from "express";
import authService from "./auth.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess } from "../../shared/utils/response.helper.js";

class AuthController {
  register = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, "User registered successfully", 201);
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Login successful");
  });

  getMe = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.getMe(req.user!.id);
    return sendSuccess(res, result, "User profile retrieved successfully");
  });
}

export default new AuthController();
