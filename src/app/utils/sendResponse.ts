import type { Response } from "express";

type TMeta = {
	page: number;
	limit: number;
	total: number;
	totalPage: number;
};

type TResponse<T> = {
	success: boolean;
	statusCode: number;
	message: string;
	data: T;
	meta?: TMeta;
};

export const sendResponse = <T>(res: Response, payload: TResponse<T>): void => {
	const { success, statusCode, message, data, meta } = payload;
	res.status(statusCode).json({ success, statusCode, message, data, ...(meta && { meta }) });
};