"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	PieChart,
	Pie,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
	Search,
	Bell,
	Download,
	ArrowUpRight,
	ArrowDownRight,
	MoreHorizontal,
	ChevronLeft,
	ChevronRight,
	Star,
	Loader2,
	X,
	Users,
	ShoppingBag,
	Calendar,
	BookOpen,
	Music,
	Landmark,
	Home,
	FileText,
	Dumbbell,
} from "lucide-react";
import {
	toastSuccess,
	toastError,
	toastInfo,
	toastLoading,
	toast,
} from "@/lib/toast";
import AdminRoute from "@/components/auth/AdminRoute";

interface ChartDataPoint {
	name: string;
	value: number;
}

interface MonthlyBarPoint {
	name: string;
	current: number;
	previous: number;
}

interface YearlyLinePoint {
	name: string;
	current: number;
	previous: number;
	target: number;
}

interface LocationData {
	name: string;
	percent: number;
	count: number;
}

interface ReviewData {
	average: number;
	total: number;
	distribution: { stars: number; count: number }[];
	featured: {
		rating: number;
		title: string;
		comment: string;
		date: string;
	} | null;
}

interface BookingRow {
	id: string;
	customer: string;
	avatar: string;
	service: string;
	amount: string;
	status: string;
}

interface ProductRow {
	product: string;
	image: string;
	sold: string;
	sales: number;
}

interface DashboardData {
	dateRange: string;
	topPerformer: { name: string; revenue: number };
	stats: {
		totalRevenue: number;
		revenueChange: number;
		totalBookings: number;
		bookingsThisMonth: number;
		bookingsChange: number;
		totalUsers: number;
		newUsersThisMonth: number;
		usersChange: number;
	};
	charts: {
		revenueByMonth: ChartDataPoint[];
		bookingsByMonth: ChartDataPoint[];
		newUsersByMonth: ChartDataPoint[];
		monthlyBarData: MonthlyBarPoint[];
		yearlyLineData: YearlyLinePoint[];
	};
	performance: {
		poojaBookings: number;
		templeVisits: number;
		posts: number;
		events: number;
		dharamshalas: number;
	};
	bookingsByLocation: LocationData[];
	visitorSourceData: Record<string, number>;
	reviews: ReviewData;
	recentBookings: BookingRow[];
	topSellingItems: ProductRow[];
}

const MiniChart = ({
	data,
	color,
}: {
	data: ChartDataPoint[];
	color: string;
}) => (
	<div className="h-10">
		<ResponsiveContainer width="100%" height="100%">
			<LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
				<Line
					type="monotone"
					dataKey="value"
					stroke={color}
					strokeWidth={2}
					dot={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	</div>
);

function formatINR(value: number): string {
	if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
	if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
	if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
	return `₹${value.toLocaleString("en-IN")}`;
}

interface ApiSearchResult {
	category: string;
	id: string;
	title: string;
	subtitle: string;
	href: string;
	icon: string;
}

const SEARCH_ICON_MAP: Record<string, React.ReactNode> = {
	user: <Users className="h-4 w-4 text-blue-500" />,
	product: <ShoppingBag className="h-4 w-4 text-green-500" />,
	temple: <Landmark className="h-4 w-4 text-orange-500" />,
	dharamshala: <Home className="h-4 w-4 text-amber-600" />,
	event: <Calendar className="h-4 w-4 text-purple-500" />,
	booking: <BookOpen className="h-4 w-4 text-cyan-500" />,
	blog: <FileText className="h-4 w-4 text-pink-500" />,
	ebook: <BookOpen className="h-4 w-4 text-indigo-500" />,
	audio: <Music className="h-4 w-4 text-emerald-500" />,
	yoga: <Dumbbell className="h-4 w-4 text-rose-500" />,
};

export default function AdminPage() {
	const [data, setData] = React.useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [searchOpen, setSearchOpen] = React.useState(false);
	const [searchResults, setSearchResults] = React.useState<ApiSearchResult[]>([]);
	const [searchLoading, setSearchLoading] = React.useState(false);
	const [bookingsFilter, setBookingsFilter] = React.useState("");
	const [productsFilter, setProductsFilter] = React.useState("");
	const searchRef = React.useRef<HTMLDivElement>(null);
	const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const router = useRouter();

	const loadDashboardData = async () => {
		setIsLoading(true);
		setError(null);
		const loadingToastId = toastLoading("Loading dashboard data...");

		try {
			const res = await fetch("/api/admin/dashboard");
			if (!res.ok) throw new Error("Failed to fetch dashboard data");
			const json = await res.json();
			setData(json);
			toastSuccess("Dashboard data loaded successfully!");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			setError(msg);
			toastError("Failed to load dashboard data");
		} finally {
			setIsLoading(false);
			toast.dismiss(loadingToastId);
		}
	};

	const handleDownload = () => {
		toastLoading("Preparing download...");
		setTimeout(() => {
			toastSuccess("Download started!");
		}, 1000);
	};

	const handleNotificationClick = () => {
		toastInfo("Showing unread notifications");
	};

	const fetchSearchResults = React.useCallback(async (query: string) => {
		if (query.trim().length < 2) {
			setSearchResults([]);
			setSearchLoading(false);
			return;
		}
		setSearchLoading(true);
		try {
			const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`);
			if (res.ok) {
				const json = await res.json();
				setSearchResults(json.results || []);
			}
		} catch {
			setSearchResults([]);
		} finally {
			setSearchLoading(false);
		}
	}, []);

	const handleSearchChange = React.useCallback(
		(value: string) => {
			setSearchQuery(value);
			setSearchOpen(true);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			if (value.trim().length < 2) {
				setSearchResults([]);
				setSearchLoading(false);
				return;
			}
			setSearchLoading(true);
			debounceRef.current = setTimeout(() => {
				fetchSearchResults(value);
			}, 300);
		},
		[fetchSearchResults]
	);

	const handleResultClick = (href: string) => {
		setSearchOpen(false);
		setSearchQuery("");
		router.push(href);
	};

	React.useEffect(() => {
		loadDashboardData();
	}, []);

	React.useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setSearchOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (isLoading) {
		return (
			<AdminRoute>
				<div className="w-full flex items-center justify-center min-h-[60vh]">
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							Loading dashboard data...
						</p>
					</div>
				</div>
			</AdminRoute>
		);
	}

	if (error || !data) {
		return (
			<AdminRoute>
				<div className="w-full flex items-center justify-center min-h-[60vh]">
					<div className="flex flex-col items-center gap-3">
						<p className="text-sm text-red-600">
							{error || "Failed to load data"}
						</p>
						<Button onClick={loadDashboardData} variant="outline" size="sm">
							Retry
						</Button>
					</div>
				</div>
			</AdminRoute>
		);
	}

	const {
		stats,
		charts,
		performance,
		bookingsByLocation,
		visitorSourceData,
		reviews: customerReviews,
		recentBookings,
		topSellingItems,
		topPerformer,
		dateRange,
	} = data;

	const visitorTotal = Object.values(visitorSourceData).reduce(
		(a, b) => a + b,
		0
	);
	const visitorColors: Record<string, string> = {};
	const palette = ["#000000", "#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6"];
	Object.keys(visitorSourceData).forEach((key, i) => {
		visitorColors[key] = palette[i % palette.length];
	});
	const visitorPieData = Object.entries(visitorSourceData).map(
		([name, value], i) => ({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			value,
			fill: palette[i % palette.length],
		})
	);

	// Table-level filters (bookings and products tables)
	const normalizedBookingsFilter = bookingsFilter.trim().toLowerCase();
	const normalizedProductsFilter = productsFilter.trim().toLowerCase();

	const filteredRecentBookings = (Array.isArray(recentBookings) ? recentBookings : []).filter((b) => {
		if (!normalizedBookingsFilter) return true;
		const haystack = `${b?.id} ${b?.customer} ${b?.service} ${b?.amount} ${b?.status}`.toLowerCase();
		return haystack.includes(normalizedBookingsFilter);
	});

	const filteredTopSellingItems = (Array.isArray(topSellingItems) ? topSellingItems : []).filter((p) => {
		if (!normalizedProductsFilter) return true;
		const haystack = `${p?.product} ${p?.sold} ${p?.sales}`.toLowerCase();
		return haystack.includes(normalizedProductsFilter);
	});

	return (
		<AdminRoute>
			<div className="w-full">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Dharmlok Dashboard</h1>
					<div className="flex items-center gap-4">
						<div ref={searchRef} className="relative">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								<Input
									type="text"
									placeholder="Search users, temples, products..."
									className="pl-10 pr-9 w-[300px] h-9"
									value={searchQuery}
									onChange={(e) => handleSearchChange(e.target.value)}
									onFocus={() => { if (searchQuery.trim().length >= 2) setSearchOpen(true); }}
								/>
								{searchQuery ? (
									<button
										type="button"
										className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-muted"
										onClick={() => { setSearchQuery(""); setSearchOpen(false); setSearchResults([]); }}
										aria-label="Clear search"
									>
										<X className="h-3.5 w-3.5 text-muted-foreground" />
									</button>
								) : null}
							</div>

							{searchOpen && searchQuery.trim().length >= 2 && (
								<div className="absolute top-full right-0 mt-1 w-[420px] bg-background border border-border rounded-lg shadow-lg z-50 max-h-[440px] overflow-y-auto">
									{searchLoading ? (
										<div className="p-6 flex flex-col items-center gap-2">
											<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
											<p className="text-xs text-muted-foreground">Searching...</p>
										</div>
									) : searchResults.length === 0 ? (
										<div className="p-6 text-center">
											<Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
											<p className="text-sm font-medium text-muted-foreground">No results found</p>
											<p className="text-xs text-muted-foreground/70 mt-1">
												No matches for &quot;{searchQuery}&quot; across users, temples, products, events, or bookings
											</p>
										</div>
									) : (
										<div className="py-1">
											<div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/50">
												{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
											</div>
											{(() => {
												const grouped: Record<string, ApiSearchResult[]> = {};
												for (const r of searchResults) {
													if (!grouped[r.category]) grouped[r.category] = [];
													grouped[r.category].push(r);
												}
												return Object.entries(grouped).map(([category, items]) => (
													<div key={category}>
														<div className="px-3 pt-2.5 pb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
															{category}
														</div>
														{items.map((item) => (
															<button
																key={item.id}
																className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors rounded-sm"
																onClick={() => handleResultClick(item.href)}
															>
																<span className="flex-shrink-0 h-8 w-8 rounded-md bg-muted flex items-center justify-center">
																	{SEARCH_ICON_MAP[item.icon] || <Search className="h-4 w-4 text-muted-foreground" />}
																</span>
																<div className="min-w-0 flex-1">
																	<p className="text-sm font-medium truncate">{item.title}</p>
																	<p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
																</div>
																<ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
															</button>
														))}
													</div>
												));
											})()}
										</div>
									)}
								</div>
							)}
						</div>
						<div
							className="relative flex items-center justify-center cursor-pointer"
							onClick={handleNotificationClick}
						>
							<Bell className="h-5 w-5 text-muted-foreground" />
							<Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
								3
							</Badge>
						</div>
						<Avatar className="h-8 w-8 border border-border">
							<div className="flex h-full w-full items-center justify-center rounded-full bg-primary">
								<span className="text-xs font-medium text-primary-foreground">
									A
								</span>
							</div>
						</Avatar>
					</div>
				</div>

				<div className="flex items-center justify-between mb-4">
					<span className="text-sm text-muted-foreground">{dateRange}</span>
					<Button
						size="sm"
						variant="outline"
						className="h-8"
						onClick={handleDownload}
						disabled={isLoading}
					>
						<Download className="h-4 w-4 mr-2" />
						Download
					</Button>
				</div>

				{/* Top Stats Row */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					{/* Top Performer Card */}
					<Card id="top-performer" className="col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 transition-all duration-300">
						<CardContent className="pt-6">
							<div className="space-y-2">
								<div className="flex items-center">
									<span className="text-lg font-bold">Top Performer!</span>
									<span className="ml-1">🎉</span>
								</div>
								<p className="text-xs text-muted-foreground">
									{topPerformer.name}
								</p>
								<div className="pt-2">
									<span className="text-2xl font-bold">
										{formatINR(topPerformer.revenue)}
									</span>
								</div>
								<div className="pt-2">
									<Button
										variant="secondary"
										size="sm"
										className="text-xs h-7 mt-1"
									>
										View Details
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Revenue Card */}
					<Card className="col-span-1">
						<CardContent className="pt-6">
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Total Revenue</span>
									<div
										className={`flex items-center text-xs ${
											stats.revenueChange >= 0
												? "text-green-600"
												: "text-red-600"
										}`}
									>
										{stats.revenueChange >= 0 ? (
											<ArrowUpRight className="h-3 w-3 mr-0.5" />
										) : (
											<ArrowDownRight className="h-3 w-3 mr-0.5" />
										)}
										<span>
											{stats.revenueChange >= 0 ? "+" : ""}
											{stats.revenueChange}%
										</span>
										<span className="text-[10px] ml-1">from last month</span>
									</div>
								</div>
								<div className="text-2xl font-bold pb-1">
									{formatINR(stats.totalRevenue)}
								</div>
								<MiniChart data={charts.revenueByMonth} color="#1E40AF" />
							</div>
						</CardContent>
					</Card>

					{/* Bookings Card */}
					<Card className="col-span-1">
						<CardContent className="pt-6">
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Bookings</span>
									<div
										className={`flex items-center text-xs ${
											stats.bookingsChange >= 0
												? "text-green-600"
												: "text-red-600"
										}`}
									>
										{stats.bookingsChange >= 0 ? (
											<ArrowUpRight className="h-3 w-3 mr-0.5" />
										) : (
											<ArrowDownRight className="h-3 w-3 mr-0.5" />
										)}
										<span>
											{stats.bookingsChange >= 0 ? "+" : ""}
											{stats.bookingsChange}%
										</span>
										<span className="text-[10px] ml-1">from last month</span>
									</div>
								</div>
								<div className="text-2xl font-bold pb-1">
									{stats.totalBookings.toLocaleString()}
								</div>
								<MiniChart data={charts.bookingsByMonth} color="#1E40AF" />
							</div>
						</CardContent>
					</Card>

					{/* New Users Card */}
					<Card className="col-span-1">
						<CardContent className="pt-6">
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">New Users</span>
									<div
										className={`flex items-center text-xs ${
											stats.usersChange >= 0
												? "text-green-600"
												: "text-red-600"
										}`}
									>
										{stats.usersChange >= 0 ? (
											<ArrowUpRight className="h-3 w-3 mr-0.5" />
										) : (
											<ArrowDownRight className="h-3 w-3 mr-0.5" />
										)}
										<span>
											{stats.usersChange >= 0 ? "+" : ""}
											{stats.usersChange}%
										</span>
										<span className="text-[10px] ml-1">from last month</span>
									</div>
								</div>
								<div className="text-2xl font-bold pb-1">
									{stats.totalUsers.toLocaleString()}
								</div>
								<MiniChart data={charts.newUsersByMonth} color="#1E40AF" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Middle Section */}
				<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
					<div className="col-span-12 md:col-span-8">
						<Card className="h-full">
							<CardHeader className="pb-0">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<CardTitle className="text-base">
											Monthly Performance
										</CardTitle>
										<Badge
											variant="outline"
											className="font-normal h-6 bg-muted/30"
										>
											Last 30 days activity
										</Badge>
									</div>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<span className="sr-only">Export</span>
										<Download className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex gap-8 pt-4 pb-4">
									<div className="text-center">
										<p className="text-sm text-muted-foreground">
											Pooja Bookings
										</p>
										<p className="text-2xl font-semibold">
											{performance.poojaBookings}
										</p>
									</div>
									<div className="text-center">
										<p className="text-sm text-muted-foreground">
											Temple Visits
										</p>
										<p className="text-2xl font-semibold">
											{performance.templeVisits}
										</p>
									</div>
									<div className="ml-auto text-right">
										<p className="text-sm text-muted-foreground">
											Total Events
										</p>
										<div className="flex items-center justify-end">
											<p className="text-2xl font-semibold">
												{performance.events}
											</p>
										</div>
									</div>
								</div>

								<div className="h-[250px] pt-4">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={charts.monthlyBarData}
											margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
												stroke="#f0f0f0"
											/>
											<XAxis
												dataKey="name"
												axisLine={false}
												tickLine={false}
												tick={{ fontSize: 12, fill: "#888" }}
												dy={10}
											/>
											<YAxis
												axisLine={false}
												tickLine={false}
												tick={{ fontSize: 12, fill: "#888" }}
												dx={-10}
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "white",
													borderRadius: "6px",
													boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
													border: "none",
													padding: "8px 12px",
												}}
												cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
											/>
											<Bar
												dataKey="current"
												name="Current Month"
												fill="#000000"
												barSize={24}
												radius={[4, 4, 0, 0]}
											/>
											<Bar
												dataKey="previous"
												name="Previous Month"
												fill="#9CA3AF"
												barSize={24}
												radius={[4, 4, 0, 0]}
											/>
											<Legend
												wrapperStyle={{ paddingTop: 20 }}
												align="center"
												verticalAlign="bottom"
												iconType="circle"
												iconSize={8}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="col-span-12 md:col-span-4">
						<Card className="h-full">
							<CardContent className="p-0">
								<div className="h-[350px] pt-6">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart
											data={charts.yearlyLineData}
											margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
												opacity={0.2}
											/>
											<XAxis dataKey="name" axisLine={false} tickLine={false} />
											<YAxis axisLine={false} tickLine={false} display="none" />
											<Tooltip
												contentStyle={{
													backgroundColor: "white",
													borderRadius: "6px",
													boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
													border: "none",
												}}
												formatter={(value: number) => [
													formatINR(value),
													"Revenue",
												]}
											/>
											<Line
												type="monotone"
												dataKey="current"
												stroke="#000000"
												strokeWidth={2}
												dot={false}
												name="Current Year"
											/>
											<Line
												type="monotone"
												dataKey="target"
												stroke="#E5E7EB"
												strokeWidth={2}
												dot={false}
												name="Target"
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
					{/* Bookings by Location */}
					<div id="bookings-by-location" className="col-span-12 md:col-span-4 transition-all duration-300">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<div>
									<CardTitle className="text-base">
										Bookings by Location
									</CardTitle>
									<CardDescription className="text-xs">
										Based on teacher locations
									</CardDescription>
								</div>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<span className="sr-only">Export</span>
									<Download className="h-4 w-4" />
								</Button>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{bookingsByLocation.length === 0 ? (
										<p className="text-sm text-muted-foreground text-center py-8">
											No location data available
										</p>
									) : (
										bookingsByLocation.map((location, index) => (
											<div key={index} className="space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium">
														{location.name}
													</span>
													<div className="flex items-center">
														<span className="text-sm font-medium">
															{location.percent}%
														</span>
														<span className="ml-2 text-xs text-muted-foreground">
															({location.count})
														</span>
													</div>
												</div>
												<Progress value={location.percent} className="h-2" />
											</div>
										))
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Visitor Sources */}
					<div id="users-by-type" className="col-span-12 md:col-span-4 transition-all duration-300">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<div>
									<CardTitle className="text-base">
										Users by Type
									</CardTitle>
									<CardDescription></CardDescription>
								</div>
							</CardHeader>
							<CardContent>
								<div className="h-[300px] relative">
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="relative h-[180px] w-[180px]">
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="text-center">
													<div className="text-3xl font-bold">
														{visitorTotal > 1000
															? `${(visitorTotal / 1000).toFixed(1)}K`
															: visitorTotal}
													</div>
													<div className="text-sm text-muted-foreground">
														Users
													</div>
												</div>
											</div>
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={visitorPieData}
														cx="50%"
														cy="50%"
														innerRadius={60}
														outerRadius={80}
														paddingAngle={2}
														dataKey="value"
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
									</div>
									<div className="absolute bottom-0 w-full">
										<div
											className="grid gap-2 text-center text-xs"
											style={{
												gridTemplateColumns: `repeat(${Math.min(
													visitorPieData.length,
													5
												)}, 1fr)`,
											}}
										>
											{visitorPieData.slice(0, 5).map((item, i) => (
												<div key={i}>
													<div className="flex justify-center">
														<div
															className="h-3 w-3 rounded-full"
															style={{ backgroundColor: item.fill }}
														></div>
													</div>
													<span className="truncate block">{item.name}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Customer Reviews */}
					<div className="col-span-12 md:col-span-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<div>
									<CardTitle className="text-base">User Reviews</CardTitle>
									<CardDescription className="text-xs">
										Based on {customerReviews.total.toLocaleString()} reviews
									</CardDescription>
								</div>
								<Button variant="ghost" size="sm" className="h-8 gap-1">
									<span>View All</span>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="space-y-2">
										{customerReviews.distribution.map((rating) => (
											<div
												key={rating.stars}
												className="flex items-center gap-2"
											>
												<div className="w-10 text-sm text-right">
													{rating.stars} ★
												</div>
												<Progress
													value={
														customerReviews.total > 0
															? (rating.count / customerReviews.total) * 100
															: 0
													}
													className="h-2 flex-1"
												/>
												<div className="w-10 text-xs text-muted-foreground text-right">
													{rating.count}
												</div>
											</div>
										))}
									</div>

									<div className="flex items-center justify-center">
										<div className="text-center">
											<div className="text-4xl font-bold">
												{customerReviews.average}
											</div>
											<div className="flex items-center justify-center">
												{[1, 2, 3, 4, 5].map((star) => (
													<Star
														key={star}
														className={`h-4 w-4 ${
															star <= Math.floor(customerReviews.average)
																? "fill-primary text-primary"
																: star <=
																  Math.ceil(customerReviews.average)
																? "fill-primary text-primary opacity-50"
																: "fill-muted text-muted-foreground"
														}`}
													/>
												))}
											</div>
											<div className="text-xs text-muted-foreground">
												out of 5
											</div>
										</div>
									</div>

									{customerReviews.featured && (
										<div className="mt-4 pt-4 border-t">
											<div className="space-y-2">
												<div className="flex items-center">
													{[1, 2, 3, 4, 5].map((star) => (
														<Star
															key={star}
															className={`h-3 w-3 ${
																star <= customerReviews.featured!.rating
																	? "fill-amber-400 text-amber-400"
																	: "fill-muted text-muted-foreground"
															}`}
														/>
													))}
												</div>
												<h4 className="font-semibold text-sm">
													{customerReviews.featured.title}
												</h4>
												<p className="text-xs text-muted-foreground line-clamp-2">
													{customerReviews.featured.comment}
												</p>
												<div className="text-xs">
													<span className="text-muted-foreground">
														{customerReviews.featured.date}
													</span>
												</div>
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Recent Bookings */}
					<div id="recent-bookings" className="col-span-12 md:col-span-6 transition-all duration-300">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-base">Recent Bookings</CardTitle>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Download className="h-4 w-4" />
									<span className="sr-only">Export</span>
								</Button>
							</CardHeader>
							<CardContent>
								<div className="relative">
									<div className="mb-3">
										<Input
											placeholder="Filter by customer, service, status..."
											className="max-w-sm h-8 text-sm"
											value={bookingsFilter}
											onChange={(e) => setBookingsFilter(e.target.value)}
										/>
									</div>
									{filteredRecentBookings.length === 0 ? (
										<p className="text-sm text-muted-foreground text-center py-8">
											{bookingsFilter
												? "No bookings match your filter"
												: "No bookings yet"}
										</p>
									) : (
										<>
											<table className="w-full text-sm text-left">
												<thead className="text-xs text-muted-foreground">
													<tr>
														<th className="px-2 py-3">ID</th>
														<th className="px-4 py-3">Customer</th>
														<th className="px-4 py-3">Service</th>
														<th className="px-4 py-3">Amount</th>
														<th className="px-4 py-3">Status</th>
														<th className="px-4 py-3"></th>
													</tr>
												</thead>
												<tbody>
													{filteredRecentBookings.slice(0, 6).map((booking) => (
														<tr
															key={booking.id}
															className="border-b border-gray-100"
														>
															<td className="px-2 py-2 font-medium">
																{booking.id}
															</td>
															<td className="px-4 py-2">
																<div className="flex items-center gap-3">
																	<Avatar className="h-8 w-8">
																		<div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground">
																			<span className="text-xs font-medium">
																				{booking.avatar}
																			</span>
																		</div>
																	</Avatar>
																	<span>{booking.customer}</span>
																</div>
															</td>
															<td className="px-4 py-2">{booking.service}</td>
															<td className="px-4 py-2">{booking.amount}</td>
															<td className="px-4 py-2">
																<Badge
																	variant="outline"
																	className={`font-normal ${
																		booking.status === "Processing" ||
																		booking.status === "Pending"
																			? "text-blue-600 bg-blue-50 border-blue-200"
																			: booking.status === "Confirmed"
																			? "text-amber-600 bg-amber-50 border-amber-200"
																			: booking.status === "Completed"
																			? "text-green-600 bg-green-50 border-green-200"
																			: "text-red-600 bg-red-50 border-red-200"
																	}`}
																>
																	{booking.status}
																</Badge>
															</td>
															<td className="px-4 py-2 text-right">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8"
																>
																	<MoreHorizontal className="h-4 w-4" />
																	<span className="sr-only">More</span>
																</Button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
											<div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
												<div>
													Showing 1 to {Math.min(filteredRecentBookings.length, 6)} of{" "}
													{filteredRecentBookings.length} entries
												</div>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
													>
														<ChevronLeft className="h-4 w-4" />
														<span className="sr-only">Previous</span>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
													>
														<ChevronRight className="h-4 w-4" />
														<span className="sr-only">Next</span>
													</Button>
												</div>
											</div>
										</>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Top Selling Items */}
					<div id="top-products" className="col-span-12 md:col-span-6 transition-all duration-300">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-base">Top Products</CardTitle>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Download className="h-4 w-4" />
									<span className="sr-only">Export</span>
								</Button>
							</CardHeader>
							<CardContent>
								<div className="relative">
									<div className="mb-3">
										<Input
											placeholder="Filter by product name or sales..."
											className="max-w-sm h-8 text-sm"
											value={productsFilter}
											onChange={(e) => setProductsFilter(e.target.value)}
										/>
									</div>
									{filteredTopSellingItems.length === 0 ? (
										<p className="text-sm text-muted-foreground text-center py-8">
											{productsFilter
												? "No products match your filter"
												: "No products yet"}
										</p>
									) : (
										<>
											<table className="w-full text-sm text-left">
												<thead className="text-xs text-muted-foreground">
													<tr>
														<th className="px-4 py-3">Product</th>
														<th className="px-4 py-3 text-right">Sold</th>
														<th className="px-4 py-3 text-right">Units</th>
														<th className="px-4 py-3"></th>
													</tr>
												</thead>
												<tbody>
													{filteredTopSellingItems.slice(0, 6).map((product, i) => (
														<tr key={i} className="border-b border-gray-100">
															<td className="px-4 py-2">
																<div className="flex items-center gap-3">
																	<div className="flex items-center justify-center h-9 w-9 rounded bg-muted overflow-hidden">
																		{product.image ? (
																			<Image
																				src={product.image}
																				alt={product.product}
																				width={36}
																				height={36}
																				className="h-full w-full object-cover"
																			/>
																		) : (
																			<span className="h-5 w-5 bg-foreground/20 rounded" />
																		)}
																	</div>
																	<span>{product.product}</span>
																</div>
															</td>
															<td className="px-4 py-2 text-right">
																{product.sold}
															</td>
															<td className="px-4 py-2 text-right">
																{product.sales}
															</td>
															<td className="px-4 py-2 text-right">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8"
																>
																	<MoreHorizontal className="h-4 w-4" />
																	<span className="sr-only">More</span>
																</Button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
											<div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
												<div>
													Showing 1 to{" "}
													{Math.min(filteredTopSellingItems.length, 6)} of{" "}
													{filteredTopSellingItems.length} entries
												</div>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
													>
														<ChevronLeft className="h-4 w-4" />
														<span className="sr-only">Previous</span>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
													>
														<ChevronRight className="h-4 w-4" />
														<span className="sr-only">Next</span>
													</Button>
												</div>
											</div>
										</>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AdminRoute>
	);
}
