import { Request, Response } from "express";
import adminService from "./admin.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import {
  sendSuccess,
  sendPaginated,
} from "../../shared/utils/response.helper.js";
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

  /**
   * POST /admin/properties/:id/verify
   */
  verifyProperty = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminService.verifyProperty(
      req.user!.id,
      id,
      req.body
    );
    return sendSuccess(res, result, "Property verification processed");
  });

  /**
   * [NEW] GET /admin/properties
   * List properties with filters (Pending, Verified, Search)
   */
  getProperties = catchAsync(async (req: Request, res: Response) => {
    // Cast query to strict type (or let Zod handle it if you use a parser in service)
    const query = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search as string,
      status: (req.query.status as "PENDING" | "VERIFIED" | "ALL") || "ALL",
    };

    const result = await adminService.getAllProperties(query);

    return sendPaginated(
      res,
      result.data,
      result.meta.total,
      result.meta.page,
      result.meta.limit,
      "Properties retrieved successfully"
    );
  });
}

export default new AdminController();
