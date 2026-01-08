"use client";
import { useState, useEffect } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Minus, Plus, PawPrint } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export interface RoomConfig {
	adults: number;
	children: number;
	childrenAges: number[];
}

interface RoomGuestSelectorProps {
	rooms: RoomConfig[];
	onRoomsChange: (rooms: RoomConfig[]) => void;
	travellingWithPets?: boolean;
	onPetsChange?: (withPets: boolean) => void;
}

export default function RoomGuestSelector({
	rooms,
	onRoomsChange,
	travellingWithPets = false,
	onPetsChange,
}: RoomGuestSelectorProps) {
	const [open, setOpen] = useState(false);
	const [localRooms, setLocalRooms] = useState<RoomConfig[]>(rooms);
	const [withPets, setWithPets] = useState(travellingWithPets);

	useEffect(() => {
		setLocalRooms(rooms);
	}, [rooms]);

	const totalRooms = localRooms.length;
	const totalAdults = localRooms.reduce((sum, room) => sum + room.adults, 0);
	const totalChildren = localRooms.reduce(
		(sum, room) => sum + room.children,
		0
	);

	const addRoom = () => {
		const newRooms = [
			...localRooms,
			{ adults: 1, children: 0, childrenAges: [] },
		];
		setLocalRooms(newRooms);
	};

	const removeRoom = () => {
		if (localRooms.length > 1) {
			const newRooms = localRooms.slice(0, -1);
			setLocalRooms(newRooms);
		}
	};

	const updateRoom = (index: number, field: keyof RoomConfig, value: number | number[]) => {
		const newRooms = [...localRooms];
		if (field === "children") {
			// Type guard: when field is "children", value must be a number
			if (typeof value !== "number") {
				console.error("Invalid value type for children field");
				return;
			}
			const prevChildrenCount = newRooms[index].children;
			newRooms[index].children = value;
			// Adjust childrenAges array
			if (value > prevChildrenCount) {
				// Add default ages for new children
				const newAges = Array(value - prevChildrenCount).fill(3);
				newRooms[index].childrenAges = [
					...newRooms[index].childrenAges,
					...newAges,
				];
			} else if (value < prevChildrenCount) {
				// Remove ages for removed children
				newRooms[index].childrenAges = newRooms[index].childrenAges.slice(
					0,
					value
				);
			}
		} else if (field === "adults") {
			// Type guard: when field is "adults", value must be a number
			if (typeof value !== "number") {
				console.error("Invalid value type for adults field");
				return;
			}
			newRooms[index].adults = value;
		} else if (field === "childrenAges") {
			// Type guard: when field is "childrenAges", value must be an array
			if (!Array.isArray(value)) {
				console.error("Invalid value type for childrenAges field");
				return;
			}
			newRooms[index].childrenAges = value;
		}
		setLocalRooms(newRooms);
	};

	const updateChildAge = (
		roomIndex: number,
		childIndex: number,
		age: number
	) => {
		const newRooms = [...localRooms];
		newRooms[roomIndex].childrenAges[childIndex] = age;
		setLocalRooms(newRooms);
	};

	const handleApply = () => {
		onRoomsChange(localRooms);
		if (onPetsChange) {
			onPetsChange(withPets);
		}
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors text-left w-full h-full">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-xs text-gray-500 mb-1 uppercase">
								Rooms & Guests
							</div>
							<div className="text-lg font-bold text-gray-900">
								{totalRooms} Room{totalRooms > 1 ? "s" : ""}, {totalAdults}{" "}
								Adult{totalAdults > 1 ? "s" : ""}
								{totalChildren > 0 &&
									`, ${totalChildren} ${
										totalChildren > 1 ? "Children" : "Child"
									}`}
							</div>
						</div>
						<ChevronDown className="h-5 w-5 text-gray-400" />
					</div>
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[440px] p-0 max-h-[600px] overflow-y-auto"
				align="start"
			>
				<div className="p-6 space-y-6">
					{/* Room Count */}
					<div className="flex items-center justify-between pb-4 border-b">
						<div>
							<div className="text-base font-semibold text-gray-900">Room</div>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={removeRoom}
								disabled={localRooms.length <= 1}
								className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<Minus className="h-5 w-5" />
							</button>
							<span className="w-8 text-center font-bold text-xl">
								{totalRooms}
							</span>
							<button
								onClick={addRoom}
								className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 transition-colors"
							>
								<Plus className="h-5 w-5" />
							</button>
						</div>
					</div>

					{/* Each Room Configuration */}
					{localRooms.map((room, roomIndex) => (
						<div
							key={roomIndex}
							className="space-y-4 pb-4 border-b last:border-b-0"
						>
							{localRooms.length > 1 && (
								<h4 className="font-semibold text-gray-700">
									Room {roomIndex + 1}
								</h4>
							)}

							{/* Adults */}
							<div className="flex items-center justify-between">
								<div>
									<div className="text-base font-semibold text-gray-900">
										Adults
									</div>
								</div>
								<div className="flex items-center gap-3">
									<button
										onClick={() =>
											updateRoom(
												roomIndex,
												"adults",
												Math.max(1, room.adults - 1)
											)
										}
										disabled={room.adults <= 1}
										className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
									>
										<Minus className="h-5 w-5" />
									</button>
									<span className="w-8 text-center font-bold text-xl">
										{room.adults}
									</span>
									<button
										onClick={() =>
											updateRoom(roomIndex, "adults", room.adults + 1)
										}
										disabled={room.adults >= 8}
										className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
									>
										<Plus className="h-5 w-5" />
									</button>
								</div>
							</div>

							{/* Children */}
							<div className="flex items-center justify-between">
								<div>
									<div className="text-base font-semibold text-gray-900">
										Children
									</div>
									<div className="text-sm text-gray-500">0 - 17 Years Old</div>
								</div>
								<div className="flex items-center gap-3">
									<button
										onClick={() =>
											updateRoom(
												roomIndex,
												"children",
												Math.max(0, room.children - 1)
											)
										}
										disabled={room.children <= 0}
										className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
									>
										<Minus className="h-5 w-5" />
									</button>
									<span className="w-8 text-center font-bold text-xl">
										{room.children}
									</span>
									<button
										onClick={() =>
											updateRoom(roomIndex, "children", room.children + 1)
										}
										disabled={room.children >= 4}
										className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
									>
										<Plus className="h-5 w-5" />
									</button>
								</div>
							</div>

							{/* Children Ages */}
							{room.children > 0 && (
								<div className="space-y-3 pt-2">
									<div className="text-sm font-medium text-gray-700">
										Age of Children
									</div>
									<div className="text-xs text-gray-500 mb-2">
										Please provide right number of children along with their
										right age for best options and prices.
									</div>
									<div className="grid grid-cols-2 gap-3">
										{Array.from({ length: room.children }).map(
											(_, childIndex) => (
												<div
													key={childIndex}
													className="flex items-center gap-2"
												>
													<label className="text-sm font-medium text-gray-700 whitespace-nowrap">
														Child {childIndex + 1}
													</label>
													<Select
														value={String(room.childrenAges[childIndex] || 3)}
														onValueChange={(value) =>
															updateChildAge(
																roomIndex,
																childIndex,
																parseInt(value)
															)
														}
													>
														<SelectTrigger className="h-10">
															<SelectValue placeholder="Age" />
														</SelectTrigger>
														<SelectContent>
															{Array.from({ length: 18 }, (_, i) => i).map(
																(age) => (
																	<SelectItem key={age} value={String(age)}>
																		{age === 0
																			? "00"
																			: age < 10
																			? `0${age}`
																			: String(age)}{" "}
																		{age === 1 ? "yr" : "yrs"}
																	</SelectItem>
																)
															)}
														</SelectContent>
													</Select>
												</div>
											)
										)}
									</div>
								</div>
							)}
						</div>
					))}

					{/* Travelling with Pets */}
					{onPetsChange && (
						<div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<Checkbox
								id="pets"
								checked={withPets}
								onCheckedChange={(checked) => setWithPets(checked as boolean)}
								className="mt-1"
							/>
							<div className="flex-1">
								<label
									htmlFor="pets"
									className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
								>
									Are you travelling with pets?
									<PawPrint className="h-5 w-5 text-gray-400" />
								</label>
								<p className="text-xs text-gray-600 mt-1">
									Selecting this option will show only pet-friendly properties.
									Please review the pet policies & applicable fees, if any.
								</p>
							</div>
						</div>
					)}

					{/* Apply Button */}
					<Button
						onClick={handleApply}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-lg"
					>
						APPLY
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
