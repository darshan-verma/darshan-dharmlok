"use client";

import { Yoga } from "./YogaTable";

interface YogaProfileCardProps {
	yoga: Yoga;
}

export default function YogaProfileCard({ yoga }: YogaProfileCardProps) {
	return (
		<div className="bg-white rounded-lg border shadow-sm p-6">
			<div className="flex flex-col items-center text-center space-y-4">
				{/* Yoga Icon/Avatar */}
				<div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
					<svg
						className="w-10 h-10 text-emerald-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				</div>

				{/* Yoga Name */}
				<div>
					<h2 className="text-xl font-bold text-gray-900">{yoga.name}</h2>
					<p className="text-sm text-gray-500">Yoga Session</p>
				</div>

				{/* Status Badge */}
				<div className="flex items-center justify-center">
					<span
						className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
							yoga.status === "Active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{yoga.status}
					</span>
				</div>

				{/* Basic Info */}
				<div className="w-full space-y-3 pt-4 border-t border-gray-200">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Date:</span>
						<span className="text-sm text-gray-900">
							{new Date(yoga.date).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Created:</span>
						<span className="text-sm text-gray-900">
							{new Date(yoga.createdAt).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-500">Updated:</span>
						<span className="text-sm text-gray-900">
							{new Date(yoga.updatedAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
