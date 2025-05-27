import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning" | "loading";

interface ToastOptions {
	description?: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export const showToast = (
	type: ToastType,
	message: string,
	options: ToastOptions = {}
) => {
	const { description, duration = 5000, action } = options;

	const toastOptions = {
		description,
		duration,
		...(action && { action }),
	};

	switch (type) {
		case "success":
			return toast.success(message, toastOptions);
		case "error":
			return toast.error(message, toastOptions);
		case "info":
			return toast.info(message, toastOptions);
		case "warning":
			return toast.warning(message, toastOptions);
		case "loading":
			return toast.loading(message, toastOptions);
		default:
			return toast(message, toastOptions);
	}
};

export const toastSuccess = (message: string, options?: ToastOptions) =>
	showToast("success", message, options);

export const toastError = (message: string, options?: ToastOptions) =>
	showToast("error", message, options);

export const toastInfo = (message: string, options?: ToastOptions) =>
	showToast("info", message, options);

export const toastWarning = (message: string, options?: ToastOptions) =>
	showToast("warning", message, options);

export const toastLoading = (message: string, options?: ToastOptions) =>
	showToast("loading", message, options);

export const dismissToast = (toastId?: string) => {
	if (toastId) {
		toast.dismiss(toastId);
	} else {
		toast.dismiss();
	}
};

export const promiseToast = <T>(
	promise: Promise<T>,
	messages: {
		loading: string;
		success: string | ((data: T) => string);
		error?: string | ((error: Error) => string);
	},
	options?: ToastOptions
) => {
	return toast.promise(promise, {
		loading: messages.loading,
		success: (data) => {
			const message =
				typeof messages.success === "function"
					? messages.success(data)
					: messages.success;
			return message;
		},
		error: (error) => {
			const message =
				messages.error && typeof messages.error === "function"
					? messages.error(error)
					: messages.error || "An error occurred";
			return message;
		},
		...options,
	});
};
export { toast };

