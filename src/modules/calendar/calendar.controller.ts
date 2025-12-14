import { Request, Response } from "express";
import calendarService from "./calendar.service.js";
import catchAsync from "../../shared/utils/catchAsync.js";

class CalendarController {
  // GET /api/v1/calendar/export/:propertyId.ics
  exportIcal = catchAsync(async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    
    // Check if filename ends with .ics (optional, but looks professional)
    const cleanId = propertyId.replace(".ics", "");

    const icalString = await calendarService.generateExportIcal(cleanId);

    // Serve as a file download
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="rentverse-${cleanId}.ics"`);
    res.send(icalString);
  });
}

export default new CalendarController();