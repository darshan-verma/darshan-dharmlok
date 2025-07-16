"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Biography from "../../components/biography";
import Posts from "../../components/posts";
import RouteProtection from "../../components/route-protection";
import Sidebar from "../../components/sidebar";
import { Loader2 } from "lucide-react";
import VideoGallery from "../../components/video-gallery";
import PhotoGallery from "../../components/photo-gallery";
import { useEffect, useState } from "react";
import { SidebarInset } from "@/components/ui/sidebar";

const LoadingState = ({ message }: { message: string }) => (
	<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
		<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
		<p className="text-lg text-muted-foreground">{message}</p>
	</div>
);

export default function DharmguruSectionPage() {
	const { data: session, status: sessionStatus } = useSession();
	const params = useParams();
	const section = Array.isArray(params.section)
		? params.section[0]
		: params.section;
	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

	useEffect(() => {
		if (session?.user?.id) {
			fetch(`/api/users/${session.user.id}`)
				.then((res) => res.json())
				.then((user) =>
					setProfileImageUrl(user.profileImageUrl || "/placeholder-avatar.png")
				)
				.catch(() => setProfileImageUrl("/placeholder-avatar.png"));
		}
	}, [session?.user?.id]);

	if (sessionStatus === "loading") {
		return <LoadingState message="Loading session..." />;
	}

	if (!session?.user?.id) {
		return <LoadingState message="User not found." />;
	}

	let content = null;
	if (section === "biography") {
		content = (
			<Biography
				userId={session.user.id}
				userType={session.user.role?.toLowerCase() || "dharmguru"}
				editable={true}
			/>
		);
	} else if (section === "posts") {
		content = (
			<Posts
				userId={session.user.id}
				userName={session.user.name || "User"}
				profileImageUrl={profileImageUrl || "/placeholder-avatar.png"}
				userType={session.user.role?.toLowerCase() || "dharmguru"}
			/>
		);
	} else if (section === "videos") {
		content = (
			<VideoGallery
				userId={session.user.id}
				editable={true}
				source="dharmguru-dashboard,dharmguru-post"
			/>
		);
	} else if (section === "photos") {
		content = <PhotoGallery userId={session.user.id} editable={true} />;
	} else {
		content = (
			<div className="text-center mt-8">
				Select a valid section from the sidebar.
			</div>
		);
	}

	return (
		<RouteProtection requiredRole="dharmguru">
			<div className="flex bg-muted/40 w-full min-h-screen">
				<Sidebar userType={session?.user?.role?.toLowerCase() || "dharmguru"} />
				<SidebarInset className="p-4 sm:p-6 lg:p-8">
					{/* All sections now use full width for consistent layout */}
					<div className="w-full">{content}</div>
				</SidebarInset>
			</div>
		</RouteProtection>
	);
}
