"use client";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";

export interface LiveDarshanItem {
	id: string;
	title: string;
	description: string;
	youtubeUrl: string;
	thumbnailUrl?: string | null;
	status: string;
	date: string;
}

interface LiveDarshanTableProps {
	streams: LiveDarshanItem[];
	loading: boolean;
	onAdd: () => void;
	onEdit: (stream: LiveDarshanItem) => void;
	onDelete: (stream: LiveDarshanItem) => void;
}

const formatDate = (value: string) => {
	if (!value) return "-";
	const date = new Date(value);
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export default function LiveDarshanTable({
	streams,
	loading,
	onEdit,
	onDelete,
}: LiveDarshanTableProps) {
	return (
		<div className="rounded-lg border bg-card shadow-sm overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Date</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						<TableRow>
							<TableCell colSpan={5} className="text-center py-8">
								Loading live darshan entries...
							</TableCell>
						</TableRow>
					) : streams.length === 0 ? (
						<TableRow>
							<TableCell colSpan={5} className="text-center py-8">
								No live darshan streams added yet.
							</TableCell>
						</TableRow>
					) : (
						streams.map((stream) => (
							<TableRow key={stream.id}>
								<TableCell className="font-medium">{stream.title}</TableCell>
								<TableCell className="max-w-sm line-clamp-2">
									{stream.description}
								</TableCell>
								<TableCell>{stream.status}</TableCell>
								<TableCell>{formatDate(stream.date)}</TableCell>
								<TableCell className="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => onEdit(stream)}
									>
										<Edit className="h-4 w-4" />
										Edit
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => onDelete(stream)}
									>
										<Trash2 className="h-4 w-4" />
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
