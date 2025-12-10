import { Request, Response } from "express";
import adminService from "./admin.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.helper.js";
import { ListUsersQuery } from "./admin.schema.js";

class AdminController {
  
  // GET /admin/users
  getUsers = catchAsync(async (req: Request, res: Response) => {
    // Explicit conversion for safety
    const query: ListUsersQuery = {
      ...req.query,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    };

    const { data, meta } = await adminService.getAllUsers(query);
    
    return sendPaginated(
      res,
      data,
      meta.total,
      meta.page,
      meta.limit,
      "Users retrieved successfully"
    );
  });

  // GET /admin/users/:id
  getUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminService.getUserDetails(id);
    return sendSuccess(res, result, "User details retrieved successfully");
  });

  // POST /admin/users/:id/verify
  verifyUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminService.verifyUser(req.user!.id, id, req.body);
    return sendSuccess(res, result, "Verification processed successfully");
  });

  // POST /admin/trust/adjust
  adjustTrust = catchAsync(async (req: Request, res: Response) => {
    const result = await adminService.adjustTrustScore(req.user!.id, req.body);
    return sendSuccess(res, result, "Trust adjustment request submitted");
  });
}

export default new AdminController();