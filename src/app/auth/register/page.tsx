"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import Image from "next/image";
import { HindiQuoteLoadingFrame } from "@/components/ui/sign-up";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const USER_TYPE_OPTIONS = [
	{ value: "kathavachak", label: "Kathavachak" },
	{ value: "dharmguru", label: "Dharmguru" },
	{ value: "hoteldharamshala", label: "Hotel/Dharamshala Vendor" },
	{ value: "panditji", label: "Pandit Ji" },
	{ value: "seller", label: "Seller" },
] as const;

export default function RegisterPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
		userType: "kathavachak",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) newErrors.name = "Name is required";
		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Email is invalid";
		}
		if (!formData.phone.trim()) {
			newErrors.phone = "Phone number is required";
		}
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}
		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}
		if (!formData.userType) {
			newErrors.userType = "User type is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Form submission started");

		if (!validateForm()) {
			console.log("Form validation failed");
			return;
		}

		setIsLoading(true);

		// Prepare the request data
		const requestData = {
			name: formData.name.trim(),
			email: formData.email.trim(),
			phone: formData.phone.trim(),
			password: formData.password,
			userType: formData.userType,
		};

		console.log("Sending registration request to /api/auth/register...", {
			...requestData,
			password: "[REDACTED]",
		});

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(requestData),
			});

			console.log("Response status:", response.status);

			// Handle non-JSON responses
			const contentType = response.headers.get("content-type");
			let data;

			if (contentType && contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				console.error("Non-JSON response:", text);
				throw new Error("Server returned non-JSON response");
			}

			if (!response.ok) {
				console.error("Registration failed:", data);
				throw new Error(data.error || "Registration failed");
			}

			console.log("Registration successful:", data);
			toast.success("Registration successful! Redirecting to login...");

			// Add a small delay before redirecting to show the success message
			setTimeout(() => {
				router.push("/auth/signin");
			}, 1000);
		} catch (error) {
			console.error("Registration error:", error);
			toast.error(
				error instanceof Error ? error.message : "Registration failed"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-center justify-center mb-4">
				<div className="w-32 h-auto mb-2">
					<Image
						src="/dharmlok-logo.svg"
						alt="Dharmlok Logo"
						width={150}
						height={80}
						priority
					/>
				</div>
			</div>
			<h2 className="text-2xl font-bold text-center text-gray-900">
				Create Admin Account
			</h2>
			<form className="space-y-4" onSubmit={handleSubmit}>
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700"
					>
						Full Name
					</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						value={formData.name}
						onChange={handleChange}
						className={`mt-1 block w-full rounded-md border ${
							errors.name ? "border-red-500" : "border-gray-300"
						} px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
						placeholder="Full name"
					/>
					{errors.name && (
						<p className="mt-1 text-sm text-red-600">{errors.name}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700"
					>
						Email address
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						value={formData.email}
						onChange={handleChange}
						className={`mt-1 block w-full rounded-md border ${
							errors.email ? "border-red-500" : "border-gray-300"
						} px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
						placeholder="Email address"
					/>
					{errors.email && (
						<p className="mt-1 text-sm text-red-600">{errors.email}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="phone"
						className="block text-sm font-medium text-gray-700"
					>
						Phone Number
					</label>
					<input
						id="phone"
						name="phone"
						type="tel"
						required
						value={formData.phone}
						onChange={handleChange}
						className={`mt-1 block w-full rounded-md border ${
							errors.phone ? "border-red-500" : "border-gray-300"
						} px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
						placeholder="Phone number"
					/>
					{errors.phone && (
						<p className="mt-1 text-sm text-red-600">{errors.phone}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-700"
					>
						Password
					</label>
					<div className="mt-1 relative rounded-md shadow-sm">
						<input
							id="password"
							name="password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							value={formData.password}
							onChange={handleChange}
							className={`appearance-none block w-full px-3 py-2 border ${
								errors.password ? "border-red-500" : "border-gray-300"
							} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
							placeholder="••••••••"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
						>
							{showPassword ? (
								<svg
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							) : (
								<svg
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
						</button>
					</div>
					{errors.password && (
						<p className="mt-1 text-sm text-red-600">{errors.password}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-gray-700"
					>
						Confirm Password
					</label>
					<div className="mt-1 relative rounded-md shadow-sm">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							value={formData.confirmPassword}
							onChange={handleChange}
							className={`appearance-none block w-full px-3 py-2 border ${
								errors.confirmPassword ? "border-red-500" : "border-gray-300"
							} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
							placeholder="••••••••"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
						>
							{showConfirmPassword ? (
								<svg
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							) : (
								<svg
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
						</button>
					</div>
					{errors.confirmPassword && (
						<p className="mt-1 text-sm text-red-600">
							{errors.confirmPassword}
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="userType"
						className="block text-sm font-medium text-gray-700"
					>
						Register as
					</label>
					<Select
						value={formData.userType}
						onValueChange={(value) => {
							setFormData((prev) => ({ ...prev, userType: value }));
							if (errors.userType) {
								setErrors((prev) => ({ ...prev, userType: "" }));
							}
						}}
					>
						<SelectTrigger
							id="userType"
							className={`mt-1 w-full ${
								errors.userType ? "border-red-500" : ""
							}`}
						>
							<SelectValue placeholder="Select role" />
						</SelectTrigger>
						<SelectContent>
							{USER_TYPE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.userType && (
						<p className="mt-1 text-sm text-red-600">{errors.userType}</p>
					)}
				</div>

				<div>
					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? "Creating Account..." : "Create Account"}
					</button>
				</div>
			</form>
			{isLoading && (
				<div className="mt-6 flex justify-center">
					<HindiQuoteLoadingFrame lines={["यह भी गुजर जाएगा।", "— एक शाश्वत सत्य"]} />
				</div>
			)}
			<div className="mt-6">
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300"></div>
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-white text-gray-500">
							Already have an account?
						</span>
					</div>
				</div>

				<div className="mt-6">
					<a
						href="/auth/signin"
						className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Sign in
					</a>
				</div>
			</div>
		</div>
	);
}
