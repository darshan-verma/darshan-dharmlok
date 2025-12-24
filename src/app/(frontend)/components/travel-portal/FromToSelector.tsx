"use client";
"use client";
import { useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface City {
	city: string;
	airport: string;
	code: string;
}

interface FromToSelectorProps {
	from: City;
	to: City;
	onSwap: () => void;
	onFromChange?: (city: City) => void;
	onToChange?: (city: City) => void;
	compact?: boolean;
	dark?: boolean;
}

const cities: City[] = [
	{
		city: "Delhi",
		airport: "Indira Gandhi International Airport",
		code: "DEL",
	},
	{
		city: "Mumbai",
		airport: "Chhatrapati Shivaji Maharaj International Airport",
		code: "BOM",
	},
	{
		city: "Bengaluru",
		airport: "Kempegowda International Airport",
		code: "BLR",
	},
	{ city: "Chennai", airport: "Chennai International Airport", code: "MAA" },
	{
		city: "Kolkata",
		airport: "Netaji Subhas Chandra Bose International Airport",
		code: "CCU",
	},
	{
		city: "Hyderabad",
		airport: "Rajiv Gandhi International Airport",
		code: "HYD",
	},
	{ city: "Pune", airport: "Pune International Airport", code: "PNQ" },
	{
		city: "Ahmedabad",
		airport: "Sardar Vallabhbhai Patel International Airport",
		code: "AMD",
	},
	{ city: "Jaipur", airport: "Jaipur International Airport", code: "JAI" },
	{ city: "Goa", airport: "Goa International Airport", code: "GOI" },
	{ city: "Kochi", airport: "Cochin International Airport", code: "COK" },
	{
		city: "Thiruvananthapuram",
		airport: "Trivandrum International Airport",
		code: "TRV",
	},
	{
		city: "Coimbatore",
		airport: "Coimbatore International Airport",
		code: "CJB",
	},
	{ city: "Visakhapatnam", airport: "Visakhapatnam Airport", code: "VTZ" },
	{
		city: "Vijayawada",
		airport: "Vijayawada International Airport",
		code: "VGA",
	},
	{
		city: "Tiruchirappalli",
		airport: "Tiruchirappalli International Airport",
		code: "TRZ",
	},
	{ city: "Madurai", airport: "Madurai International Airport", code: "IXM" },
	{
		city: "Mangalore",
		airport: "Mangalore International Airport",
		code: "IXE",
	},
	{ city: "Kozhikode", airport: "Calicut International Airport", code: "CCJ" },
	{
		city: "Nagpur",
		airport: "Dr. Babasaheb Ambedkar International Airport",
		code: "NAG",
	},
	{ city: "Indore", airport: "Devi Ahilyabai Holkar Airport", code: "IDR" },
	{ city: "Bhopal", airport: "Raja Bhoj Airport", code: "BHO" },
	{ city: "Raipur", airport: "Swami Vivekananda Airport", code: "RPR" },
	{ city: "Jabalpur", airport: "Jabalpur Airport", code: "JLR" },
	{
		city: "Lucknow",
		airport: "Chaudhary Charan Singh International Airport",
		code: "LKO",
	},
	{ city: "Kanpur", airport: "Kanpur Airport", code: "KNU" },
	{ city: "Varanasi", airport: "Lal Bahadur Shastri Airport", code: "VNS" },
	{ city: "Allahabad", airport: "Prayagraj Airport", code: "IXD" },
	{ city: "Patna", airport: "Jay Prakash Narayan Airport", code: "PAT" },
	{ city: "Ranchi", airport: "Birsa Munda Airport", code: "IXR" },
	{
		city: "Guwahati",
		airport: "Lokpriya Gopinath Bordoloi International Airport",
		code: "GAU",
	},
	{ city: "Silchar", airport: "Silchar Airport", code: "IXS" },
	{ city: "Dibrugarh", airport: "Dibrugarh Airport", code: "DIB" },
	{ city: "Jorhat", airport: "Jorhat Airport", code: "JRH" },
	{ city: "Imphal", airport: "Imphal International Airport", code: "IMF" },
	{ city: "Dimapur", airport: "Dimapur Airport", code: "DMU" },
	{ city: "Aizawl", airport: "Lengpui Airport", code: "AJL" },
	{ city: "Agartala", airport: "Maharaja Bir Bikram Airport", code: "IXA" },
	{ city: "Shillong", airport: "Shillong Airport", code: "SHL" },
	{ city: "Bagdogra", airport: "Bagdogra Airport", code: "IXB" },
	{
		city: "Port Blair",
		airport: "Veer Savarkar International Airport",
		code: "IXZ",
	},
	{
		city: "Chandigarh",
		airport: "Chandigarh International Airport",
		code: "IXC",
	},
	{
		city: "Amritsar",
		airport: "Sri Guru Ram Dass Jee International Airport",
		code: "ATQ",
	},
	{ city: "Ludhiana", airport: "Ludhiana Airport", code: "LUH" },
	{ city: "Jammu", airport: "Jammu Airport", code: "IXJ" },
	{
		city: "Srinagar",
		airport: "Sheikh ul-Alam International Airport",
		code: "SXR",
	},
	{ city: "Leh", airport: "Kushok Bakula Rimpochee Airport", code: "IXL" },
	{ city: "Udaipur", airport: "Maharana Pratap Airport", code: "UDR" },
	{ city: "Jodhpur", airport: "Jodhpur Airport", code: "JDH" },
	{ city: "Bikaner", airport: "Bikaner Airport", code: "BKB" },
	{ city: "Surat", airport: "Surat Airport", code: "STV" },
	{ city: "Vadodara", airport: "Vadodara Airport", code: "BDQ" },
	{ city: "Rajkot", airport: "Rajkot Airport", code: "RAJ" },
	{ city: "Bhavnagar", airport: "Bhavnagar Airport", code: "BHU" },
	{ city: "Aurangabad", airport: "Aurangabad Airport", code: "IXU" },
	{ city: "Nashik", airport: "Nashik Airport", code: "ISK" },
	{ city: "Kolhapur", airport: "Kolhapur Airport", code: "KLH" },
	{ city: "Belgaum", airport: "Belgaum Airport", code: "IXG" },
	{ city: "Hubli", airport: "Hubli Airport", code: "HBX" },
	{ city: "Mysore", airport: "Mysore Airport", code: "MYQ" },
	{ city: "Salem", airport: "Salem Airport", code: "SXV" },
	{ city: "Tuticorin", airport: "Tuticorin Airport", code: "TCR" },
	{ city: "Rajahmundry", airport: "Rajahmundry Airport", code: "RJA" },
	{ city: "Tirupati", airport: "Tirupati Airport", code: "TIR" },
	{ city: "Kadapa", airport: "Kadapa Airport", code: "CDP" },
	{ city: "Warangal", airport: "Warangal Airport", code: "WGC" },
	{ city: "Jamnagar", airport: "Jamnagar Airport", code: "JGA" },
	{ city: "Porbandar", airport: "Porbandar Airport", code: "PBD" },
	{ city: "Kandla", airport: "Kandla Airport", code: "IXY" },
	{ city: "Bhuj", airport: "Bhuj Airport", code: "BHJ" },
	{ city: "Dehradun", airport: "Dehradun Airport", code: "DED" },
	{ city: "Pantnagar", airport: "Pantnagar Airport", code: "PGH" },
	{ city: "Rudrapur", airport: "Rudrapur Airport", code: "RDP" },
	{ city: "Gorakhpur", airport: "Gorakhpur Airport", code: "GOP" },
	{ city: "Bharatpur", airport: "Bharatpur Airport", code: "BHR" },
	{ city: "Gwalior", airport: "Gwalior Airport", code: "GWL" },
	{ city: "Khajuraho", airport: "Khajuraho Airport", code: "HJR" },
	{ city: "Satna", airport: "Satna Airport", code: "TNI" },
	{ city: "Bilaspur", airport: "Bilaspur Airport", code: "PAB" },
	{ city: "Jamshedpur", airport: "Sonari Airport", code: "IXW" },
	{
		city: "Bhubaneswar",
		airport: "Biju Patnaik International Airport",
		code: "BBI",
	},
	{ city: "Cuttack", airport: "Cuttack Airport", code: "CTC" },
	{ city: "Berhampur", airport: "Berhampur Airport", code: "BAM" },
	{ city: "Rourkela", airport: "Rourkela Airport", code: "RRK" },
	{ city: "Tezpur", airport: "Tezpur Airport", code: "TEZ" },
	{ city: "North Lakhimpur", airport: "Lilabari Airport", code: "IXI" },
	{ city: "Pasighat", airport: "Pasighat Airport", code: "IXT" },
	{ city: "Itanagar", airport: "Itanagar Airport", code: "HGI" },
	{ city: "Kavaratti", airport: "Agatti Airport", code: "AGX" },
	{ city: "Minicoy", airport: "Minicoy Airport", code: "BDK" },
];

function CitySelector({
	selectedCity,
	onSelect,
	label,
	compact = false,
	dark = false,
	side,
}: {
	selectedCity: City;
	onSelect: (city: City) => void;
	label: string;
	compact?: boolean;
	dark?: boolean;
	side?: "from" | "to";
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filteredCities = cities.filter(
		(city) =>
			city.city.toLowerCase().includes(search.toLowerCase()) ||
			city.code.toLowerCase().includes(search.toLowerCase()) ||
			city.airport.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					className={`w-full h-full ${compact ? "p-2" : "p-3"} ${
						side === "from" ? "pr-12" : ""
					} ${side === "to" ? "pl-12" : ""} ${
						dark
							? "bg-slate-800 text-white hover:bg-slate-700"
							: "hover:bg-gray-100"
					} cursor-pointer transition-colors text-left`}
				>
					<div
						className={`${
							dark ? "text-[10px] text-slate-300" : "text-[10px] text-gray-500"
						} mb-1 uppercase`}
					>
						{label}
					</div>
					{selectedCity.city ? (
						<>
							<div
								className={`${compact ? "text-lg" : "text-2xl"} font-bold ${
									dark ? "text-white" : "text-gray-900"
								}`}
							>
								{selectedCity.city}
							</div>
							<div
								className={`${compact ? "text-xs" : "text-xs"} ${
									dark ? "text-slate-300" : "text-gray-500"
								}`}
							>
								{selectedCity.code}, {selectedCity.airport}
							</div>
						</>
					) : (
						<div
							className={`${compact ? "text-sm" : "text-lg"} ${
								dark ? "text-slate-400" : "text-gray-400"
							}`}
						>
							Select city
						</div>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className={`${compact ? "w-64" : "w-80"} p-0`}
				align="start"
			>
				<div className="p-3 border-b">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search cities..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div className="max-h-64 overflow-y-auto">
					{filteredCities.length > 0 ? (
						filteredCities.map((city) => (
							<button
								key={city.code}
								onClick={() => {
									onSelect(city);
									setOpen(false);
									setSearch("");
								}}
								className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 ${
									city.code === selectedCity.code ? "bg-blue-50" : ""
								}`}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className="font-semibold text-gray-900">
											{city.city}
										</div>
										<div className="text-xs text-gray-500">{city.airport}</div>
									</div>
									<div className="text-sm font-semibold text-gray-600">
										{city.code}
									</div>
								</div>
							</button>
						))
					) : (
						<div className="px-4 py-8 text-center text-sm text-gray-500">
							No cities found
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default function FromToSelector({
	from,
	to,
	onSwap,
	onFromChange,
	onToChange,
	compact = false,
	dark = false,
}: FromToSelectorProps) {
	const handleFromChange = (city: City) => {
		if (onFromChange) onFromChange(city);
	};

	const handleToChange = (city: City) => {
		if (onToChange) onToChange(city);
	};

	return (
		<div
			className={`relative flex items-center gap-0 rounded-lg overflow-hidden border h-full ${
				dark ? "bg-slate-900 border-slate-700" : "bg-gray-50 border-gray-200"
			}`}
		>
			{/* From Section */}
			<div className="flex-1 h-full">
				<CitySelector
					selectedCity={from}
					onSelect={handleFromChange}
					label="From"
					compact={compact}
					dark={dark}
					side="from"
				/>
			</div>

			{/* Swap Button (absolute to avoid taking layout width) */}
			<button
				onClick={onSwap}
				aria-label="Swap cities"
				className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none ${
					compact ? "p-1" : "p-2"
				} rounded-full`}
			>
				<div
					className={`${
						compact ? "w-8 h-8" : "w-10 h-10"
					} rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all`}
				>
					<ArrowLeftRight className={`${compact ? "h-3 w-3" : "h-4 w-4"}`} />
				</div>
			</button>

			{/* To Section */}
			<div
				className={`${
					dark ? "border-l border-slate-700" : "border-l border-gray-200"
				} flex-1 min-w-[200px] h-full`}
			>
				<CitySelector
					selectedCity={to}
					onSelect={handleToChange}
					label="To"
					compact={compact}
					dark={dark}
					side="to"
				/>
			</div>
		</div>
	);
}
// >
// 	<div className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all`}>
// 		<ArrowLeftRight className={`${compact ? "h-3 w-3" : "h-4 w-4"}`} />
// 	</div>
// </button>

{
	/* To Section */
}
// 			<div className="flex-1 border-l border-gray-200">
// 				<CitySelector selectedCity={to} onSelect={handleToChange} label="To" compact={compact} />
// 			</div>
// 		</div>
// 	);
// }
