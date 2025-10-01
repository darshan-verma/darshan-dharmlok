"use client";

import { YogaSession } from "./BookYogaTable";

interface BookYogaProfileCardProps {
	session: YogaSession;
}

export default function BookYogaProfileCard({
	session,
}: BookYogaProfileCardProps) {
	return (
		<div className="bg-white rounded-lg border shadow-sm p-6">
			<div className="flex flex-col items-center text-center space-y-4">
				{/* Session Icon/Avatar */}
				<div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
					<svg
						className="w-10 h-10 text-blue-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>

				{/* Session Name */}
				<div>
					<h2 className="text-xl font-bold text-gray-900">{session.name}</h2>
					<p className="text-sm text-gray-500">Yoga Session</p>
				</div>

				{/* Status Badge */}
				<div className="flex items-center justify-center">
					<span
						className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
							session.status === "Active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{session.status}
					</span>
				</div>

				{/* Basic Info */}
				<div className="w-full space-y-3 pt-4 border-t border-gray-200">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Trainer:</span>
						<span className="text-sm text-gray-900">{session.trainerName}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Date:</span>
						<span className="text-sm text-gray-900">
							{new Date(session.date).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Type:</span>
						<span className="text-sm text-gray-900">{session.serviceType}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Price:</span>
						<span className="text-sm text-gray-900">
							{session.price ? `₹${session.price}` : "Free"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Duration:</span>
						<span className="text-sm text-gray-900">
							{session.duration ? `${session.duration} min` : "N/A"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Capacity:</span>
						<span className="text-sm text-gray-900">
							{session.capacity || "Unlimited"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Created:</span>
						<span className="text-sm text-gray-900">
							{new Date(session.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
