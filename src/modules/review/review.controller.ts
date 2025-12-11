import { Request, Response } from "express";
import reviewService from "./review.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { sendSuccess, sendInfiniteList } from "../../shared/utils/response.helper.js";

class ReviewController {
  create = catchAsync(async (req: Request, res: Response) => {
    // req.user guaranteed by verifyToken
    const result = await reviewService.submitReview(req.user!.id, req.user!.role, req.body);
    return sendSuccess(res, result, "Review submitted", 201);
  });

  listByProperty = catchAsync(async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const { data, meta } = await reviewService.getPropertyReviews(propertyId, req.query);
    return sendInfiniteList(res, data, meta as any, "Reviews retrieved");
  });
}

export default new ReviewController();