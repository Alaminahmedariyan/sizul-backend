import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { contactMessageService } from "./contactMessage.service";

 const createContactMessage = catchAsync(
  async (req: Request, res: Response) => {
    const message = await contactMessageService.createContactMessageInDB(
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Thank you for reaching out! We'll get back to you soon.",
      data: message,
    });
  },
);

 const getAllContactMessages = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } =
      await contactMessageService.getAllContactMessagesFromDB(
        req.query as Record<string, unknown>,
      );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Messages retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getContactMessageById = catchAsync(
  async (req: Request, res: Response) => {
    const message = await contactMessageService.getContactMessageByIdFromDB(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Message retrieved successfully.",
      data: message,
    });
  },
);

 const updateContactMessageStatus = catchAsync(
  async (req: Request, res: Response) => {
    const message = await contactMessageService.updateContactMessageStatusInDB(
      req.params.id as string,
      req.body.status,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Message status updated successfully.",
      data: message,
    });
  },
);

 const deleteContactMessage = catchAsync(
  async (req: Request, res: Response) => {
    await contactMessageService.deleteContactMessageFromDB(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Message deleted successfully.",
      data: null,
    });
  },
);

export const contactMessageController = {
	createContactMessage,
	getAllContactMessages,
	getContactMessageById,
	updateContactMessageStatus,
	deleteContactMessage,
};