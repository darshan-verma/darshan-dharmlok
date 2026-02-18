"use client";

import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { toast } from "@/lib/toast";
import Image from "next/image";
import { AuthComponent } from "@/components/ui/sign-up";

export default function UserSignInPage() {
	const router = useRouter();

	const handleGoogleSignIn = async () => {
		try {
			await signIn("google", {
				callbackUrl: "/",
				redirect: true,
			});
		} catch (error) {
			console.error("Google sign in error:", error);
			toast.error("Google sign in failed");
		}
	};

	const handleEmailSubmit = async (email: string, password: string) => {
		const response = await signIn("credentials", {
			redirect: false,
			email: email,
			password: password,
		});
		
		if (response?.error) {
			throw new Error(response.error);
		}
		
		toast.success("Sign in successful!");

		// Wait for session to update and fetch the latest session
		setTimeout(async () => {
			const updatedSession = await getSession();
			const role = updatedSession?.user?.role?.toLowerCase();
			if (role === "admin") {
				router.replace("/admin");
			} else if (role === "kathavachak") {
				router.replace("/dashboard/kathavachak/posts");
			} else if (role === "dharmguru") {
				router.replace("/dashboard/dharmguru/posts");
			} else if (role === "hoteldharamshala") {
				router.replace("/dashboard/hotel_dharamshala_vendor");
			} else if (role === "panditji") {
				router.replace("/dashboard/panditji");
			} else if (role === "seller") {
				router.replace("/dashboard/seller");
			} else if (role === "yoga" || role === "trainer" || role === "yoga-trainer") {
				router.replace("/dashboard/yoga/go-live");
			} else if (
				role === "motivationalspeaker" ||
				role === "motivational-speaker" ||
				role === "motivation-speaker"
			) {
				router.replace("/dashboard/motivational-speaker/go-live");
			} else {
				// Regular user - redirect to home
				router.replace("/");
			}
		}, 300);
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
			onGoogleSignIn={handleGoogleSignIn}
			onEmailSubmit={handleEmailSubmit}
			mode="signin"
			signupLink="/auth/user/signup"
			signinLink="/auth/user/signin"
		/>
	);
}
