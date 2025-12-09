import { Request, Response } from "express";
import adminService from "./admin.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendPaginated } from "../../shared/utils/response.helper.js";
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
}

export default new AdminController();