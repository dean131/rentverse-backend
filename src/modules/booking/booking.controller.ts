import { Request, Response } from "express";
import bookingService from "./booking.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import {
  sendSuccess,
  sendInfiniteList,
} from "../../shared/utils/response.helper.js";

class BookingController {
  create = catchAsync(async (req: Request, res: Response) => {
    const result = await bookingService.createBooking(req.user!.id, req.body);
    return sendSuccess(
      res,
      result,
      "Booking request created successfully. Please pay the invoice.",
      201
    );
  });

  getMine = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await bookingService.getMyBookings(
      req.user!.id,
      req.user!.role,
      req.query
    );

    return sendInfiniteList(res, data, meta, "Bookings retrieved successfully");
  });
}

export default new BookingController();
