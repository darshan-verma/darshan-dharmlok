"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, User, Mail, Phone, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getDashboardRoute,
	isRegularUser,
} from "@/app/dashboard/components/user-role";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface UserProfile {
	id: string;
	name: string;
	email: string;
	phone?: string;
	profileImageUrl?: string;
	userType?: string;
	status?: string;
	createdAt?: string;
}

export default function UserDashboardPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (status === "loading") return;

		if (status !== "authenticated" || !session?.user?.id) {
			router.replace("/auth/user/signin");
			return;
		}

		const role = session.user.role;
		const specialistDashboard = getDashboardRoute(role);
		if (specialistDashboard && !isRegularUser(role)) {
			router.replace(specialistDashboard);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/users/${session.user.id}`);
				if (!res.ok) throw new Error("Failed to load profile");
				const data = await res.json();
				if (!cancelled) setProfile(data);
			} catch {
				if (!cancelled) {
					setProfile({
						id: session.user.id,
						name: session.user.name || "",
						email: session.user.email || "",
					});
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [session, status, router]);

	if (status === "loading" || loading) {
		return (
			<div className="flex w-full min-h-svh items-center justify-center">
				<Loader2 className="h-10 w-10 animate-spin text-orange-500" />
			</div>
		);
	}

	const displayName = profile?.name || session?.user?.name || "User";
	const displayEmail = profile?.email || session?.user?.email || "";
	const displayPhone = profile?.phone || "Not added";
	const avatarUrl =
		profile?.profileImageUrl || session?.user?.image || undefined;

	return (
		<div className="flex w-full min-h-svh flex-col">
			<Header />
			<main className="flex-1 bg-gray-50 py-12">
				<div className="container mx-auto px-4 max-w-2xl">
					<Card>
						<CardHeader className="text-center pb-2">
							<div className="flex justify-center mb-4">
								<Avatar className="w-24 h-24 border-4 border-orange-500/30">
									<AvatarImage src={avatarUrl} alt={displayName} />
									<AvatarFallback className="bg-orange-500 text-white text-2xl">
										{displayName.charAt(0)?.toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
							</div>
							<CardTitle className="text-2xl">{displayName}</CardTitle>
							<p className="text-sm text-muted-foreground">My Account</p>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
								<Mail className="h-5 w-5 text-orange-500 shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground">Email</p>
									<p className="text-sm font-medium">{displayEmail}</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
								<Phone className="h-5 w-5 text-orange-500 shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground">Phone</p>
									<p className="text-sm font-medium">{displayPhone}</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
								<User className="h-5 w-5 text-orange-500 shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground">Account type</p>
									<p className="text-sm font-medium capitalize">
										{profile?.userType || "User"}
									</p>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row gap-3 pt-4">
								<Button asChild variant="outline" className="flex-1">
									<Link href="/know-more">
										<Settings className="mr-2 h-4 w-4" />
										Contact &amp; Support
									</Link>
								</Button>
								<Button
									variant="outline"
									className="flex-1 text-red-600 hover:text-red-700"
									onClick={() => signOut({ callbackUrl: "/" })}
								>
									<LogOut className="mr-2 h-4 w-4" />
									Sign out
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
			<Footer />
		</div>
	);
}
