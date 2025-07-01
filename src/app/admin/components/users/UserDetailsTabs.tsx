"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserDetailsTab from "./UserDetailsTab";
import UserBiographyTab from "./UserBiographyTab";
import UserPostsTab from "./UserPostsTab";
import UserPreferencesTab from "./UserPreferencesTab";
import UserActivityTab from "./UserActivityTab";

interface Address {
	id?: string;
	type: "home" | "work" | "other";
	label?: string;
	line1: string;
	line2?: string;
	city: string;
	state?: string;
	country: string;
	pincode?: string;
}

interface UserPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

interface User {
	name: string;
	phone: string;
	email: string;
	userType?: string;
	bio?: string;
	addresses?: Address[];
	status?: "Active" | "Inactive" | "Suspended";
	preferences?: UserPreferences;
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
	addresses?: {
		[key: string]: {
			line1?: string;
			city?: string;
			country?: string;
			label?: string;
		};
	};
}

interface UserDetailsTabsProps {
	user: User | null;
	editedUser: Partial<User> | null;
	setEditedUser: (
		user: Partial<User> | ((prev: Partial<User> | null) => Partial<User> | null)
	) => void;
	isEditing: boolean;
	isSaving: boolean;
	errors: FormErrors;
	setErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
	setAddressesToDelete: (fn: (prevState: string[]) => string[]) => void;
	handleSaveChanges: () => void;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
	formatPhoneNumber: (value: string) => string;
	handlePostImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handlePostVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleSavePosts: (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => void;
	handleRemovePostImage: (imageUrl: string) => void;
	isUploadingPostImage: boolean;
	isUploadingPostVideo: boolean;
	isSavingPosts: boolean;
	postImages: string[];
	showVideoUpload: boolean;
	setShowVideoUpload: React.Dispatch<React.SetStateAction<boolean>>;
	showImageUpload: boolean;
	setShowImageUpload: React.Dispatch<React.SetStateAction<boolean>>;
	handleRemovePostVideo: (videoUrl: string) => void;
	postVideos: string[];
}

export default function UserDetailsTabs({
	user,
	editedUser,
	setEditedUser,
	isEditing,
	isSaving,
	errors,
	setErrors,
	setAddressesToDelete,
	handleSaveChanges,
	handleBlockNoteChange,
	safeBlockNoteHtml,
	formatPhoneNumber,
	handlePostImageUpload,
	handlePostVideoUpload,
	handleSavePosts,
	handleRemovePostImage,
	isUploadingPostImage,
	isUploadingPostVideo,
	isSavingPosts,
	postImages,
	showVideoUpload,
	setShowVideoUpload,
	showImageUpload,
	setShowImageUpload,
	handleRemovePostVideo,
	postVideos,
}: UserDetailsTabsProps) {
	if (!user || !editedUser) {
		return (
			<Card>
				<CardHeader className="animate-pulse">
					<div className="h-8 w-full bg-muted rounded" />
				</CardHeader>
				<CardContent className="animate-pulse">
					<div className="h-40 w-full bg-muted rounded" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Tabs defaultValue="details">
			<TabsList className="grid grid-cols-5 mb-4">
				<TabsTrigger value="details">User Details</TabsTrigger>
				<TabsTrigger value="biography">Biography</TabsTrigger>
				<TabsTrigger value="post">User Post</TabsTrigger>
				<TabsTrigger value="preferences">Preferences</TabsTrigger>
				<TabsTrigger value="activity">Activity Log</TabsTrigger>
			</TabsList>

			<TabsContent value="details" className="space-y-4">
				<UserDetailsTab
					{...{
						isEditing,
						editedUser,
						setEditedUser,
						errors,
						setErrors,
						handleSaveChanges,
						isSaving,
						formatPhoneNumber,
						setAddressesToDelete,
						user,
					}}
				/>
			</TabsContent>

			<TabsContent value="biography" className="space-y-4">
				<UserBiographyTab
					{...{
						isEditing,
						editedUser,
						handleBlockNoteChange,
						safeBlockNoteHtml,
					}}
				/>
			</TabsContent>

			<TabsContent value="post" className="space-y-4">
				<UserPostsTab
					{...{
						isEditing,
						postImages,
						postVideos,
						isUploadingPostImage,
						isUploadingPostVideo,
						handlePostImageUpload,
						handleRemovePostImage,
						handlePostVideoUpload,
						handleRemovePostVideo,
						isSavingPosts,
						handleSavePosts,
						showImageUpload,
						setShowImageUpload,
						showVideoUpload,
						setShowVideoUpload,
					}}
				/>
			</TabsContent>

			<TabsContent value="preferences" className="space-y-4">
				<UserPreferencesTab
					{...{
						isEditing,
						editedUser,
						setEditedUser,
						handleSaveChanges,
						user,
					}}
				/>
			</TabsContent>

			<TabsContent value="activity" className="space-y-4">
				<UserActivityTab />
			</TabsContent>
		</Tabs>
	);
}
