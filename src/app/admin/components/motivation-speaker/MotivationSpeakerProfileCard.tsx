"use client";

import Image from "next/image";
import { MotivationSpeaker } from "./MotivationSpeakerTable";

interface MotivationSpeakerProfileCardProps {
	speaker: MotivationSpeaker;
}

export default function MotivationSpeakerProfileCard({
	speaker,
}: MotivationSpeakerProfileCardProps) {
	return (
		<div className="bg-white rounded-lg border shadow-sm p-6">
			<div className="flex flex-col items-center text-center space-y-4">
				{/* Speaker Profile Image */}
				<div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-purple-100">
					{speaker.profileImage ? (
						<Image
							src={speaker.profileImage}
							alt={speaker.name}
							width={80}
							height={80}
							className="w-full h-full object-cover"
						/>
					) : (
						<svg
							className="w-10 h-10 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					)}
				</div>

				{/* Speaker Name */}
				<div>
					<h2 className="text-xl font-bold text-gray-900">{speaker.name}</h2>
					<p className="text-sm text-gray-500">Motivation Speaker</p>
				</div>

				{/* Status Badge */}
				<div className="flex items-center justify-center">
					<span
						className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
							speaker.status === "Active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{speaker.status}
					</span>
				</div>

				{/* Basic Info */}
				<div className="w-full space-y-3 pt-4 border-t border-gray-200">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Date:</span>
						<span className="text-sm text-gray-900">
							{new Date(speaker.date).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Phone:</span>
						<span className="text-sm text-gray-900">{speaker.phone}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Email:</span>
						<span className="text-sm text-gray-900">{speaker.email}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Timings:</span>
						<span className="text-sm text-gray-900">{speaker.timings}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Category:</span>
						<span className="text-sm text-gray-900">{speaker.category}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Created:</span>
						<span className="text-sm text-gray-900">
							{new Date(speaker.createdAt).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Updated:</span>
						<span className="text-sm text-gray-900">
							{new Date(speaker.updatedAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
