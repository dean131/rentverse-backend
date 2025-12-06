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

  refresh = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return sendSuccess(res, result, "Token refreshed successfully");
  });

  logout = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    return sendSuccess(res, null, "Logged out successfully");
  });

  getMe = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.getMe(req.user!.id);
    return sendSuccess(res, result, "User profile retrieved successfully");
  });

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.updateProfile(req.user!.id, req.body);
    return sendSuccess(res, result, "Profile updated successfully");
  });
}

export default new AuthController();
