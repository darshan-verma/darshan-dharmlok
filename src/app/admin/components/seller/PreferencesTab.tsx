"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Seller } from "./types";

interface PreferencesTabProps {
	seller: Seller | null;
	editedSeller: Partial<Seller> | null;
	setEditedSeller: React.Dispatch<React.SetStateAction<Partial<Seller> | null>>;
	isEditing: boolean;
	handleSaveChanges: () => Promise<void>;
}

export default function PreferencesTab({
	seller,
	editedSeller,
	setEditedSeller,
	isEditing,
	handleSaveChanges,
}: PreferencesTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Seller Preferences</CardTitle>
				<CardDescription>
					Manage notification settings and seller preferences.
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
									checked={editedSeller?.preferences?.notifications || false}
									onChange={(e) =>
										setEditedSeller((prev) =>
											prev
												? {
														...prev,
														preferences: {
															...prev.preferences!,
															notifications: e.target.checked,
														},
												  }
												: null
										)
									}
									className="h-4 w-4"
								/>
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="newsletter">Subscribe to Newsletter</Label>
								<input
									type="checkbox"
									id="newsletter"
									checked={editedSeller?.preferences?.newsletter || false}
									onChange={(e) =>
										setEditedSeller((prev) =>
											prev
												? {
														...prev,
														preferences: {
															...prev.preferences!,
															newsletter: e.target.checked,
														},
												  }
												: null
										)
									}
									className="h-4 w-4"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="language">Preferred Language</Label>
								<Select
									value={editedSeller?.preferences?.language || ""}
									onValueChange={(value) =>
										setEditedSeller((prev) =>
											prev
												? {
														...prev,
														preferences: {
															...prev.preferences!,
															language: value,
														},
												  }
												: null
										)
									}
								>
									<SelectTrigger id="language">
										<SelectValue placeholder="Select language" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="Hindi">Hindi</SelectItem>
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
										{seller?.preferences?.notifications
											? "Enabled"
											: "Disabled"}
									</p>
								</div>
								<div>
									<h3 className="text-sm text-muted-foreground">Newsletter</h3>
									<p className="font-medium">
										{seller?.preferences?.newsletter
											? "Subscribed"
											: "Not Subscribed"}
									</p>
								</div>
								<div>
									<h3 className="text-sm text-muted-foreground">
										Preferred Language
									</h3>
									<p className="font-medium">{seller?.preferences?.language}</p>
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
