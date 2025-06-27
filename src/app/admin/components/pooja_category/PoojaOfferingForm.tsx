import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Save, X } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { PanditjiUser, Offering } from "./types";

interface Props {
	allPanditjis: PanditjiUser[];
	offerings: Offering[];
	poojaCategoryId: string;
	isSubmitting: boolean;
	editingOfferingId: string | null;
	onSubmit: (
		providerId: string,
		price: string,
		details: string
	) => Promise<void>;
}

export function PoojaOfferingForm({
	allPanditjis,
	offerings,
	isSubmitting,
	editingOfferingId,
	onSubmit,
}: Props) {
	const [selectedPanditjiId, setSelectedPanditjiId] = useState<string>("");
	const [formPrice, setFormPrice] = useState<string>("");
	const [formDetails, setFormDetails] = useState<string>("");
	const [panditjiSearch, setPanditjiSearch] = useState("");
	const [panditjiDropdownOpen, setPanditjiDropdownOpen] = useState(false);

	// Reset form fields when editingOfferingId changes
	useEffect(() => {
		if (editingOfferingId) {
			const editOffering = offerings.find((o) => o.id === editingOfferingId);
			if (editOffering) {
				setSelectedPanditjiId(editOffering.provider.id);
				setFormPrice(editOffering.price.toString());
				setFormDetails(editOffering.details || "");
			}
		} else {
			setSelectedPanditjiId("");
			setFormPrice("");
			setFormDetails("");
		}
		// Also reset search and dropdown
		setPanditjiSearch("");
		setPanditjiDropdownOpen(false);
	}, [editingOfferingId, offerings]);

	// Filter Panditji dropdown by search and exclude already added
	const filteredPanditjis = allPanditjis.filter(
		(p) =>
			// Exclude if already in offerings (unless editing that offering)
			!offerings.some(
				(o) =>
					o.provider.id === p.id &&
					// Allow editing the same Panditji
					(editingOfferingId ? o.id !== editingOfferingId : true)
			) &&
			(p.name.toLowerCase().includes(panditjiSearch.toLowerCase()) ||
				(p.email?.toLowerCase().includes(panditjiSearch.toLowerCase()) ??
					false))
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit(selectedPanditjiId, formPrice, formDetails);
		// Reset form after successful submission
		setSelectedPanditjiId("");
		setFormPrice("");
		setFormDetails("");
	};

	return (
		<Card>
			<CardHeader className="pb-2 pt-3">
				<CardTitle className="text-lg">
					{editingOfferingId
						? "Edit Panditji Offering"
						: "Add Panditji Offering"}
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="block text-sm font-medium mb-1">
							Select Panditji <span className="text-red-500">*</span>
						</label>
						<Popover
							open={panditjiDropdownOpen}
							onOpenChange={setPanditjiDropdownOpen}
						>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full justify-between h-9 text-sm"
									disabled={!!editingOfferingId}
									type="button"
								>
									<span className="flex-grow text-left truncate">
										{selectedPanditjiId
											? allPanditjis.find((p) => p.id === selectedPanditjiId)
													?.name
											: "Click to select Panditji"}
									</span>
									{selectedPanditjiId ? (
										<X
											className="h-4 w-4 ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setSelectedPanditjiId("");
												setPanditjiSearch("");
												setPanditjiDropdownOpen(false);
											}}
											role="button"
											aria-label="Clear selection"
										/>
									) : (
										<span className="ml-2 text-gray-400">&#9662;</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[320px] p-2">
								<Input
									placeholder="Search Panditji by name or email"
									value={panditjiSearch}
									onChange={(e) => setPanditjiSearch(e.target.value)}
									className="mb-2 h-8 text-sm"
									autoFocus
								/>
								<div className="max-h-48 overflow-y-auto">
									{filteredPanditjis.length === 0 ? (
										<div className="px-3 py-2 text-gray-500 text-sm select-none">
											No Panditji found
										</div>
									) : (
										filteredPanditjis.map((p) => (
											<div
												key={p.id}
												className={`px-3 py-2 cursor-pointer hover:bg-muted rounded text-sm ${
													selectedPanditjiId === p.id
														? "bg-muted font-semibold"
														: ""
												}`}
												onClick={() => {
													setSelectedPanditjiId(p.id);
													setPanditjiDropdownOpen(false);
												}}
											>
												{p.name} {p.email ? `(${p.email})` : ""}
											</div>
										))
									)}
								</div>
							</PopoverContent>
						</Popover>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							Price (₹) <span className="text-red-500">*</span>
						</label>
						<Input
							type="number"
							value={formPrice}
							onChange={(e) => setFormPrice(e.target.value)}
							placeholder="Enter price"
							required
							min={0}
							className="h-9 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Details</label>
						<Textarea
							value={formDetails}
							onChange={(e) => setFormDetails(e.target.value)}
							placeholder="Describe the service"
							rows={2}
							className="text-sm"
						/>
					</div>
					<Button
						type="submit"
						disabled={isSubmitting || !selectedPanditjiId || !formPrice}
						size="sm"
						className="mt-1 text-sm"
					>
						{isSubmitting ? (
							<>
								<Save className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : editingOfferingId ? (
							<>
								<Save className="h-4 w-4 mr-2" />
								Update Offering
							</>
						) : (
							<>
								<PlusCircle className="h-4 w-4 mr-2" />
								Add Offering
							</>
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
