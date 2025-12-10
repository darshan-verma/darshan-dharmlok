import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
	return (
		<div className="container mx-auto p-4 space-y-8 max-w-7xl">
			<div className="flex items-center gap-2 mb-6">
				<Skeleton className="h-8 w-8 rounded-full" />
				<Skeleton className="h-8 w-64" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Flight Details Skeleton */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2 border-b">
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="pt-4 space-y-6">
						<div className="flex justify-between items-start">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-5 w-20" />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-5 w-24" />
								</div>
							</div>
						</div>

						<div>
							<Skeleton className="h-5 w-32 mb-3" />
							<div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
								<div className="flex justify-between">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-16" />
								</div>
								<div className="flex justify-between">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-16" />
								</div>
								<div className="my-2 border-t border-gray-200" />
								<div className="flex justify-between">
									<Skeleton className="h-5 w-24" />
									<Skeleton className="h-5 w-20" />
								</div>
							</div>
						</div>

						<div>
							<Skeleton className="h-5 w-24 mb-3" />
							<div className="space-y-4">
								<div className="border rounded-lg p-4 space-y-4 bg-white">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-12" />
											<Skeleton className="h-4 w-4" />
											<Skeleton className="h-6 w-12" />
										</div>
										<Skeleton className="h-5 w-16" />
									</div>
									<div className="flex items-center gap-2 mb-2">
										<Skeleton className="h-4 w-4" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Skeleton className="h-3 w-16 mb-1" />
											<Skeleton className="h-5 w-20" />
											<Skeleton className="h-3 w-24" />
										</div>
										<div>
											<Skeleton className="h-3 w-16 mb-1" />
											<Skeleton className="h-5 w-20" />
											<Skeleton className="h-3 w-24" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Fare Rules Skeleton */}
				<Card className="shadow-sm h-fit">
					<CardHeader className="pb-2 border-b">
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="pt-4">
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="bg-gray-50 p-4 rounded-lg border border-gray-100"
								>
									<Skeleton className="h-5 w-48 mb-2" />
									<Skeleton className="h-4 w-full mb-1" />
									<Skeleton className="h-4 w-3/4" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Fare Upsell Skeleton */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2 border-b">
						<Skeleton className="h-6 w-40" />
					</CardHeader>
					<CardContent className="pt-4">
						<Skeleton className="h-40 w-full rounded-lg" />
					</CardContent>
				</Card>

				{/* Price RBD Skeleton */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2 border-b">
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="pt-4">
						<Skeleton className="h-24 w-full rounded-lg mb-4" />
						<Skeleton className="h-40 w-full rounded-lg" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
