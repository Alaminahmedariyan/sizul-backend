class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode?: string;
	public readonly details?: unknown;
	public readonly isOperational: boolean;

	constructor(
		statusCode: number,
		message: string,
		errorCode?: string,
		details?: unknown
	) {
		super(message);

		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.isOperational = true;

		if (errorCode !== undefined) {
			this.errorCode = errorCode;
		}

		if (details !== undefined) {
			this.details = details;
		}

		Error.captureStackTrace?.(this, this.constructor);
	}
}

export default AppError;