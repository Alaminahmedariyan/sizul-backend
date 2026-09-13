import { v2 as cloudinary } from "cloudinary";

import config from "../app/config";
import AppError from "../app/errors/appError";

if (
	!config.cloudinary.cloudName ||
	!config.cloudinary.apiKey ||
	!config.cloudinary.apiSecret
) {
	throw new AppError(
		500,
		"Cloudinary is not properly configured.",
	);
}

cloudinary.config({
	cloud_name: config.cloudinary.cloudName,
	api_key: config.cloudinary.apiKey,
	api_secret: config.cloudinary.apiSecret,
});

export { cloudinary };