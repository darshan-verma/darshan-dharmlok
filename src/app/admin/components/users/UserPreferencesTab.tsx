"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
} from "@/components/ui/select";
import { Save } from "lucide-react";

interface UserPreferences {
	notifications: boolean;
	newsletter: boolean;
	language: string;
}

interface User {
	preferences?: UserPreferences;
	// ...add other user fields if needed...
}

interface UserPreferencesTabProps {
	isEditing: boolean;
	editedUser: User;
	setEditedUser: React.Dispatch<React.SetStateAction<User>>;
	handleSaveChanges: () => void;
	user: User;
}

export default function UserPreferencesTab({
	isEditing,
	editedUser,
	setEditedUser,
	handleSaveChanges,
	user,
}: UserPreferencesTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>User Preferences</CardTitle>
				<CardDescription>
					Manage notification settings and user preferences.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{isEditing ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="notifications">Email Notifications</Label>
								<input
									type="checkbox"
									id="notifications"
									checked={editedUser?.preferences?.notifications || false}
									onChange={(e) =>
										setEditedUser((prev) => ({
											...prev,
											preferences: {
												...(prev.preferences as UserPreferences),
												notifications: e.target.checked,
											},
										}))
									}
									className="h-4 w-4"
								/>
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="newsletter">Subscribe to Newsletter</Label>
								<input
									type="checkbox"
									id="newsletter"
									checked={editedUser?.preferences?.newsletter || false}
									onChange={(e) =>
										setEditedUser((prev) => ({
											...prev,
											preferences: {
												...(prev.preferences as UserPreferences),
												newsletter: e.target.checked,
											},
										}))
									}
									className="h-4 w-4"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="language">Preferred Language</Label>
								<Select
									value={editedUser?.preferences?.language || ""}
									onValueChange={(value) =>
										setEditedUser((prev) => ({
											...prev,
											preferences: {
												...(prev.preferences as UserPreferences),
												language: value,
											},
										}))
									}
								>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="English">English</SelectItem>
											<SelectItem value="Sanskrit">Sanskrit</SelectItem>
											<SelectItem value="Tamil">Tamil</SelectItem>
											<SelectItem value="Bengali">Bengali</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h3 className="text-sm text-muted-foreground">
										Email Notifications
									</h3>
									<p className="font-medium">
										{user?.preferences?.notifications ? "Enabled" : "Disabled"}
									</p>
								</div>
								<div>
									<h3 className="text-sm text-muted-foreground">Newsletter</h3>
									<p className="font-medium">
										{user?.preferences?.newsletter
											? "Subscribed"
											: "Not Subscribed"}
									</p>
								</div>
								<div>
									<h3 className="text-sm text-muted-foreground">
										Preferred Language
									</h3>
									<p className="font-medium">{user?.preferences?.language}</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
			{isEditing && (
				<CardFooter>
					<Button onClick={handleSaveChanges} className="w-full">
						<Save className="h-4 w-4 mr-2" />
						Save Preferences
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
