import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import AppError from "../../errors/appError";
import config from "../../config";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const primaryClientUrl = () => config.app.clientUrl.split(",")[0]?.trim() ?? "";

const getRequestingUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not logged in.");
  }
  return {
    id: req.user.id,
    role: req.user.role as "ADMIN" | "STAFF" | "CLIENT",
  };
};

// ---------- Stripe ----------

const createStripeCheckout = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createStripeCheckoutInDB(
    req.body.proposalId,
    getRequestingUser(req),
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Checkout session created successfully.",
    data: result,
  });
});

// ---------- bKash ----------

const createBkashCheckout = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createBkashPaymentInDB(
    req.body.proposalId,
    getRequestingUser(req),
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "bKash payment session created successfully.",
    data: result,
  });
});

// Public — hit directly by bKash's redirect, no session cookie present.
const bkashCallback = catchAsync(async (req: Request, res: Response) => {
  const paymentID = req.query.paymentID as string | undefined;
  const status = (req.query.status as string | undefined) ?? "failure";

  if (!paymentID) {
    res.redirect(`${primaryClientUrl()}/payments/error`);
    return;
  }

  try {
    const result = await paymentService.handleBkashCallbackInDB(
      paymentID,
      status,
    );
    res.redirect(
      `${primaryClientUrl()}/proposals/${result.payment.proposalId}?payment=${result.redirectStatus}`,
    );
  } catch (error) {
    console.error("[Payment] bKash callback failed:", error);
    res.redirect(`${primaryClientUrl()}/payments/error`);
  }
});

// ---------- SSLCommerz ----------

const createSslcommerzCheckout = catchAsync(
  async (req: Request, res: Response) => {
    const result = await paymentService.createSslcommerzPaymentInDB(
      req.body.proposalId,
      getRequestingUser(req),
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "SSLCommerz payment session created successfully.",
      data: result,
    });
  },
);

// Public — hit directly by SSLCommerz's redirect/IPN, no session cookie present.
const sslcommerzCallback = catchAsync(async (req: Request, res: Response) => {
  const source = { ...req.query, ...req.body } as Record<string, string>;
  const tranId = source.tran_id;
  const status =
    (req.query.status as string | undefined) ?? source.status ?? "fail";
  const valId = source.val_id;

  if (!tranId) {
    res.redirect(`${primaryClientUrl()}/payments/error`);
    return;
  }

  try {
    const result = await paymentService.handleSslcommerzCallbackInDB(
      tranId,
      status,
      valId,
    );
    res.redirect(
      `${primaryClientUrl()}/proposals/${result.payment.proposalId}?payment=${result.redirectStatus}`,
    );
  } catch (error) {
    console.error("[Payment] SSLCommerz callback failed:", error);
    res.redirect(`${primaryClientUrl()}/payments/error`);
  }
});

// ---------- Shared ----------

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await paymentService.getAllPaymentsFromDB(
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payments retrieved successfully.",
    data,
    meta,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentByIdFromDB(
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment retrieved successfully.",
    data: payment,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await paymentService.getMyPaymentsFromDB(
    req.user?.id ?? "",
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payments retrieved successfully.",
    data,
    meta,
  });
});

const refundStripePayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.refundStripePaymentInDB(
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment refunded successfully.",
    data: payment,
  });
});

export const paymentController = {
	createStripeCheckout,
	createBkashCheckout,
	bkashCallback,
	createSslcommerzCheckout,
	sslcommerzCallback,
	getAllPayments,
	getPaymentById,
	getMyPayments,
	refundStripePayment,
};