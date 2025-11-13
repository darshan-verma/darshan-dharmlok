import Link from "next/link";
import Image from "next/image";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, IndianRupee } from "lucide-react";

interface Destination {
	id: string;
	name: string;
	description: string;
	image: string;
	location: string;
	category: string;
	price: number;
}

interface DestinationCardProps {
	destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
	return (
		<Link
			href={`/travel-portal/destinations/${destination.id}`}
			className="group"
		>
			<Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
				<div className="relative h-48 w-full overflow-hidden bg-muted">
					<Image
						src={destination.image}
						alt={destination.name}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-110"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>
					<div className="absolute top-3 right-3 z-10">
						<Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
							{destination.category}
						</Badge>
					</div>
				</div>
				<CardHeader className="pb-3">
					<h3 className="text-xl font-semibold line-clamp-1 group-hover:text-primary transition-colors">
						{destination.name}
					</h3>
					<div className="flex items-center text-sm text-muted-foreground mt-1">
						<MapPin className="h-4 w-4 mr-1" />
						<span className="line-clamp-1">{destination.location}</span>
					</div>
				</CardHeader>
				<CardContent className="pb-3">
					<p className="text-sm text-muted-foreground line-clamp-2">
						{destination.description}
					</p>
				</CardContent>
				<CardFooter className="pt-3 border-t">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center text-lg font-bold text-primary">
							<IndianRupee className="h-5 w-5" />
							<span>{destination.price.toLocaleString("en-IN")}</span>
						</div>
						<span className="text-sm text-muted-foreground">per person</span>
					</div>
				</CardFooter>
			</Card>
		</Link>
	);
}
