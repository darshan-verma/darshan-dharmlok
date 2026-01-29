import { Skeleton } from "@/components/ui/skeleton";

export default function FrontendLoading() {
	return (
		<div className="min-h-[60vh] w-full">
			{/* Hero / breadcrumb skeleton */}
			<div className="border-b bg-muted/30">
				<div className="container mx-auto px-4 py-8 md:py-12">
					<div className="flex flex-col gap-4">
						<Skeleton className="h-8 w-48 rounded-lg" />
						<Skeleton className="h-10 w-3/4 max-w-md rounded-lg" />
					</div>
				</div>
			</div>

			{/* Content skeleton */}
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-center gap-2 py-12">
					<div
						className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"
						aria-hidden
					/>
					<span className="text-muted-foreground text-sm font-medium">
						Loading...
					</span>
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div
							key={i}
							className="overflow-hidden rounded-xl border bg-card shadow-sm"
						>
							<Skeleton className="aspect-[4/3] w-full rounded-none" />
							<div className="space-y-3 p-4">
								<Skeleton className="h-5 w-3/4 rounded" />
								<Skeleton className="h-4 w-full rounded" />
								<Skeleton className="h-4 w-1/2 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
