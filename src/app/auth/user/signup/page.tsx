"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "@/lib/toast";
import Image from "next/image";
import { AuthComponent } from "@/components/ui/sign-up";

export default function UserSignUpPage() {
	const router = useRouter();

	const handleGoogleSignUp = async () => {
		try {
			await signIn("google", {
				callbackUrl: "/",
				redirect: true,
			});
		} catch (error) {
			console.error("Google sign up error:", error);
			toast.error("Google sign up failed");
		}
	};

	const handleEmailSubmit = async (email: string, password: string) => {
		// For signup, we need to register the user first
		// Since the component doesn't collect name and phone, we'll use defaults
		// In a real scenario, you might want to add those fields
		const requestData = {
			name: email.split("@")[0], // Use email prefix as name
			email: email.trim().toLowerCase(),
			phone: "", // Empty for now, user can update later
			password: password,
			userType: "user", // Regular user type
		};

		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(requestData),
		});

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
		toast.success("Account created successfully! Please sign in.");

		// Redirect to sign in page after a delay
		setTimeout(() => {
			router.push("/auth/user/signin");
		}, 2000);
	};

	const CustomLogo = () => (
		<div className="relative w-24 h-24">
			<Image
				src="/dharmlok-logo.svg"
				alt="Dharmlok Logo"
				width={96}
				height={96}
				priority
				className="object-contain"
			/>
		</div>
	);

	return (
		<AuthComponent
			logo={<CustomLogo />}
			brandName="Dharmlok"
			onGoogleSignIn={handleGoogleSignUp}
			onEmailSubmit={handleEmailSubmit}
			mode="signup"
			signupLink="/auth/user/signup"
			signinLink="/auth/user/signin"
		/>
	);
}
