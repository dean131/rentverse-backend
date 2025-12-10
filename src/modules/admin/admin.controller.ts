import { Request, Response } from "express";
import adminService from "./admin.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import {
  sendPaginated,
  sendSuccess,
} from "../../shared/utils/response.helper.js";
import { ListUsersQuery } from "./admin.schema.js";

class AdminController {
  getUsers = catchAsync(async (req: Request, res: Response) => {
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

  /**
   *  Get User Details
   */
  getUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await adminService.getUserDetails(id);
    return sendSuccess(res, user, "User details retrieved successfully");
  });

  /**
   * [NEW] Verify User
   */
  verifyUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    // req.body verified by middleware
    const result = await adminService.verifyUser(req.user!.id, id, req.body);
    return sendSuccess(res, result, "Verification processed successfully");
  });
}

export default new AdminController();
