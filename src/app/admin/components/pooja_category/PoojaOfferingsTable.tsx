import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Edit,
	MoreVertical,
	Activity,
	CheckCircle2,
	CircleSlash,
	Trash2,
	AlertTriangle,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Offering } from "./types";

interface Props {
	offerings: Offering[];
	loading: boolean;
	onEdit: (offering: Offering) => void;
	onDelete: (offering: Offering) => void;
	onChangeStatus: (offering: Offering) => void;
}

export function PoojaOfferingsTable({
	offerings,
	loading,
	onEdit,
	onDelete,
	onChangeStatus,
}: Props) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [offeringToDelete, setOfferingToDelete] = useState<Offering | null>(
		null
	);

	const handleDeleteWithConfirm = (offering: Offering) => {
		setOfferingToDelete(offering);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (offeringToDelete) {
			onDelete(offeringToDelete);
			setIsDeleteDialogOpen(false);
		}
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Panditji Offerings</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-4">Loading offerings...</div>
					) : offerings.length === 0 ? (
						<div className="text-gray-500">No offerings yet.</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm border">
								<thead>
									<tr className="bg-muted">
										<th className="px-3 py-2 text-left">Name</th>
										<th className="px-3 py-2 text-left">Pricing</th>
										<th className="px-3 py-2 text-left">Details</th>
										<th className="px-3 py-2 text-left">Status</th>
										<th className="px-3 py-2 text-center">Actions</th>
									</tr>
								</thead>
								<tbody>
									{offerings.map((offering) => (
										<tr key={offering.id} className="border-t">
											<td className="px-3 py-2">{offering.provider?.name}</td>
											<td className="px-3 py-2">₹{offering.price}</td>
											<td className="px-3 py-2">{offering.details || "-"}</td>
											<td className="px-3 py-2">
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
														offering.status === "Active"
															? "bg-green-100 text-green-800"
															: "bg-red-100 text-red-800"
													}`}
												>
													{offering.status === "Active" ? "Active" : "Inactive"}
												</span>
											</td>
											<td className="px-3 py-2 text-center">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															aria-label="Actions"
														>
															<MoreVertical className="h-5 w-5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>
															Manage Pooja Category
														</DropdownMenuLabel>
														<DropdownMenuSeparator />
														<DropdownMenuSub>
															<DropdownMenuSubTrigger>
																<Activity className="h-4 w-4 mr-2" />
																Change Status
															</DropdownMenuSubTrigger>
															<DropdownMenuSubContent>
																<DropdownMenuItem
																	onClick={() => onChangeStatus(offering)}
																	className={
																		offering.status === "Active"
																			? "bg-blue-50"
																			: ""
																	}
																>
																	<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
																	Active
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => onChangeStatus(offering)}
																	className={
																		offering.status === "Inactive"
																			? "bg-blue-50"
																			: ""
																	}
																>
																	<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
																	Inactive
																</DropdownMenuItem>
															</DropdownMenuSubContent>
														</DropdownMenuSub>
														<DropdownMenuItem onClick={() => onEdit(offering)}>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															className="flex items-center gap-2 text-red-600"
															onSelect={(e) => {
																e.preventDefault();
																handleDeleteWithConfirm(offering);
															}}
														>
															<Trash2 className="h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Service Offering</DialogTitle>
					</DialogHeader>
					<div className="flex items-center gap-3 py-4">
						<AlertTriangle className="h-6 w-6 text-red-500" />
						<div>
							<p className="font-semibold text-red-700">
								Are you sure you want to delete this offering by{" "}
								<span className="font-bold">
									{offeringToDelete?.provider?.name}
								</span>
								?
							</p>
							<p className="text-sm text-gray-600 mt-1">
								This action cannot be undone.
							</p>
						</div>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
