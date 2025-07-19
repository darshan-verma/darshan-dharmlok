import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Edit,
	Trash2,
	CheckCircle2,
	CircleSlash,
	Activity,
	ImageIcon,
} from "lucide-react";
import { Song, formatDate, getStatusColor } from "./types";
import Pagination from "../Pagination/Pagination";

interface SongTableProps {
	songs: Song[];
	onEdit: (song: Song) => void;
	onDelete: (song: Song) => void;
	onUpdateStatus: (id: string, status: string) => void;
}

export function SongTable(props: SongTableProps) {
	const { songs, onEdit, onDelete, onUpdateStatus } = props;
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const totalItems = songs.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedSongs = songs.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Description</TableHead>
						<TableHead className="text-center">Audio</TableHead>
						<TableHead>Thumbnail</TableHead>
						<TableHead className="text-center">Status</TableHead>
						<TableHead className="text-center">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{paginatedSongs.length > 0 ? (
						paginatedSongs.map((song) => (
							<TableRow key={song.id}>
								<TableCell>{song.name}</TableCell>
								<TableCell>{formatDate(song.date)}</TableCell>
								<TableCell>{song.description}</TableCell>
								<TableCell className="min-w-[180px] text-center">
									{song.audioFile ? (
										<audio
											controls
											src={song.audioFile}
											className="w-44 mx-auto"
										/>
									) : (
										<span className="text-xs text-gray-400">No audio</span>
									)}
								</TableCell>
								<TableCell>
									{song.thumbnail ? (
										<Image
											src={song.thumbnail}
											alt="Thumbnail"
											width={500}
											height={300}
											className="w-16 h-10 object-cover rounded border"
										/>
									) : (
										<ImageIcon className="h-6 w-6 text-gray-400" />
									)}
								</TableCell>
								<TableCell className="text-center">
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
											song.status
										)}`}
									>
										{song.status}
									</span>
								</TableCell>
								<TableCell className="text-center">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" aria-label="Actions">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="20"
													height="20"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													className="h-5 w-5"
												>
													<circle cx="12" cy="5" r="1.5" />
													<circle cx="12" cy="12" r="1.5" />
													<circle cx="12" cy="19" r="1.5" />
												</svg>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>Manage Song</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuSub>
												<DropdownMenuSubTrigger>
													<Activity className="h-4 w-4 mr-2" />
													Change Status
												</DropdownMenuSubTrigger>
												<DropdownMenuSubContent>
													<DropdownMenuItem
														onClick={() => onUpdateStatus(song.id, "Active")}
														className={
															song.status === "Active" ? "bg-blue-50" : ""
														}
													>
														<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
														Active
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => onUpdateStatus(song.id, "Inactive")}
														className={
															song.status === "Inactive" ? "bg-blue-50" : ""
														}
													>
														<CircleSlash className="h-4 w-4 mr-2 text-gray-500" />
														Inactive
													</DropdownMenuItem>
												</DropdownMenuSubContent>
											</DropdownMenuSub>
											<DropdownMenuItem onClick={() => onEdit(song)}>
												<Edit className="h-4 w-4 mr-2" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												className="flex items-center gap-2 text-red-600"
												onSelect={(e) => {
													e.preventDefault();
													onDelete(song);
												}}
											>
												<Trash2 className="h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={7} className="text-center py-6">
								No songs found. Add a new song to this audio library.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalItems}
				itemsPerPage={itemsPerPage}
				onPageChange={setCurrentPage}
			/>
		</div>
	);
}
