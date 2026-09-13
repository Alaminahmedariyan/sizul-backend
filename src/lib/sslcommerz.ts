import SSLCommerzPayment from "sslcommerz-lts";

import config from "../app/config";

export const sslcommerz = new SSLCommerzPayment(
	config.sslcommerz.storeId ?? "",
	config.sslcommerz.storePassword ?? "",
	config.sslcommerz.isLive,
);