"use client";
//TODO : chunk splitting for admin using webpack config
import * as React from "react";
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
	MoreHorizontal,
	ChevronLeft,
	ChevronRight,
	Star,
} from "lucide-react";
import {
	toastSuccess,
	toastError,
	toastInfo,
	toastLoading,
	toastWarning,
	toast,
} from "@/lib/toast";

// Sample data
const revenueData = [
	{ name: "Jan", value: 120000 },
	{ name: "Feb", value: 190000 },
	{ name: "Mar", value: 150000 },
	{ name: "Apr", value: 220000 },
	{ name: "May", value: 180000 },
	{ name: "Jun", value: 250000 },
];

const bookingsData = [
	{ name: "Jan", value: 150 },
	{ name: "Feb", value: 120 },
	{ name: "Mar", value: 180 },
	{ name: "Apr", value: 200 },
	{ name: "May", value: 150 },
	{ name: "Jun", value: 190 },
];

const newUsersData = [
	{ name: "Jan", value: 300 },
	{ name: "Feb", value: 270 },
	{ name: "Mar", value: 350 },
	{ name: "Apr", value: 310 },
	{ name: "May", value: 280 },
	{ name: "Jun", value: 340 },
];

const monthlyBarData = [
	{ name: "Jan", current: 65, previous: 55 },
	{ name: "Feb", current: 90, previous: 80 },
	{ name: "Mar", current: 85, previous: 60 },
	{ name: "Apr", current: 50, previous: 70 },
	{ name: "May", current: 60, previous: 50 },
	{ name: "Jun", current: 90, previous: 75 },
];

const yearlyLineData = Array.from({ length: 12 }, (_, i) => {
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	return {
		name: monthNames[i],
		current: Math.floor(Math.random() * 30000) + 40000,
		previous: Math.floor(Math.random() * 20000) + 35000,
		target: Math.floor(Math.random() * 10000) + 50000,
	};
});

const bookingsByLocation = [
	{ name: "Delhi", percent: 85, change: "+3.2%" },
	{ name: "Mumbai", percent: 80, change: "+7.8%" },
	{ name: "Varanasi", percent: 83, change: "-2.1%" },
	{ name: "Haridwar", percent: 60, change: "+3.4%" },
	{ name: "Rishikesh", percent: 45, change: "+1.2%" },
	{ name: "Mathura", percent: 40, change: "-1%" },
];

const visitorSourceData = {
	direct: 25,
	social: 30,
	referral: 15,
	search: 20,
	other: 10,
};

const customerReviews = {
	average: 4.5,
	total: 5000,
	distribution: [
		{ stars: 5, count: 4000 },
		{ stars: 4, count: 2100 },
		{ stars: 3, count: 600 },
		{ stars: 2, count: 631 },
		{ stars: 1, count: 344 },
	],
	featured: {
		rating: 5,
		title: "Amazing experience with Pandit Ji",
		comment:
			"The pooja was conducted perfectly and with all the rituals explained. The Pandit Ji was very knowledgeable and patient with our questions.",
		author: "Suresh K.",
		verified: true,
		date: "March 12, 2023",
	},
};

const recentBookings = [
	{
		id: "#1023",
		customer: "Rahul Sharma",
		avatar: "RS",
		service: "Griha Pravesh Pooja",
		amount: "₹12,500",
		status: "Processing",
	},
	{
		id: "#2045",
		customer: "Ananya Patel",
		avatar: "AP",
		service: "Satyanarayana Katha",
		amount: "₹8,500",
		status: "Confirmed",
	},
	{
		id: "#3067",
		customer: "Vikram Singh",
		avatar: "VS",
		service: "Dharamshala Booking",
		amount: "₹5,200",
		status: "Completed",
	},
	{
		id: "#4089",
		customer: "Pooja Verma",
		avatar: "PV",
		service: "Ganesh Pooja",
		amount: "₹4,500",
		status: "Processing",
	},
	{
		id: "#5102",
		customer: "Karan Malhotra",
		avatar: "KM",
		service: "Temple Visit Package",
		amount: "₹15,000",
		status: "Cancelled",
	},
	{
		id: "#6123",
		customer: "Neha Gupta",
		avatar: "NG",
		service: "Dharmguru Consultation",
		amount: "₹2,100",
		status: "Confirmed",
	},
	{
		id: "#7145",
		customer: "Amit Joshi",
		avatar: "AJ",
		service: "Bhagwat Katha Event",
		amount: "₹25,000",
		status: "Completed",
	},
	{
		id: "#8167",
		customer: "Meera Reddy",
		avatar: "MR",
		service: "Rudrabhishek",
		amount: "₹7,500",
		status: "Processing",
	},
];

const topSellingItems = [
	{
		product: "Puja Samagri Kit",
		image: "",
		sold: "₹156,000",
		sales: 130,
	},
	{
		product: "Rudraksha Mala",
		image: "",
		sold: "₹89,400",
		sales: 120,
	},
	{
		product: "Brass Diya Set",
		image: "",
		sold: "₹75,000",
		sales: 150,
	},
	{
		product: "Ganga Jal Bottle",
		image: "",
		sold: "₹45,000",
		sales: 300,
	},
	{
		product: "Dharmik Books",
		image: "",
		sold: "₹120,000",
		sales: 200,
	},
	{
		product: "Incense Sticks Pack",
		image: "",
		sold: "₹36,000",
		sales: 600,
	},
	{
		product: "Copper Kalash",
		image: "",
		sold: "₹86,000",
		sales: 86,
	},
	{
		product: "Yantra Collection",
		image: "",
		sold: "₹98,000",
		sales: 49,
	},
];

interface MiniChartProps {
	data: ChartDataPoint[];
	color: string;
}

const MiniChart = ({ data, color }: MiniChartProps) => {
	return (
		<div className="h-10">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
				>
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
};

interface ChartDataPoint {
	name: string; // or date, depending on your x-axis
	value: number;
}

export default function DharmlokDashboard() {
	const [isLoading, setIsLoading] = React.useState(false);

	const loadDashboardData = async () => {
		setIsLoading(true);
		const loadingToastId = toastLoading("Loading dashboard data...");

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));
			toastSuccess("Dashboard data loaded successfully!");
		} catch {
			toastError("Failed to load dashboard data");
		} finally {
			setIsLoading(false);
			// Dismiss the loading toast if it's still showing
			toast.dismiss(loadingToastId);
		}
	};

	const handleDownload = () => {
		toastLoading("Preparing download...");

		setTimeout(() => {
			toastSuccess("Download started!");
			// Actual download logic would go here
		}, 1000);
	};
	const handleNotificationClick = () => {
		toastInfo("Showing unread notifications");
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const input = e.currentTarget.querySelector("input");
		if (input?.value) {
			toastInfo(`Searching for: ${input.value}`);
		} else {
			toastWarning("Please enter a search term");
		}
	};

	React.useEffect(() => {
		loadDashboardData();
	}, []);

	return (
		<div className="w-full">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Dharmlok Dashboard</h1>
				<div className="flex items-center gap-4">
					<form onSubmit={handleSearch} className="relative">
						<span className="absolute inset-y-0 left-0 flex items-center pl-3">
							<Search className="h-4 w-4 text-muted-foreground" />
						</span>
						<Input
							type="text"
							placeholder="Search..."
							className="pl-10 w-[200px] h-8"
						/>
					</form>
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
				<span className="text-sm text-muted-foreground">
					27 Apr 2023 - 24 May 2023
				</span>
				<Button
					size="sm"
					variant="outline"
					className="h-8"
					onClick={handleDownload}
					disabled={isLoading}
				>
					<Download className="h-4 w-4 mr-2" />
					{isLoading ? "Preparing..." : "Download"}
				</Button>
			</div>

			{/* Top Stats Row */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				{/* Top Performer Card */}
				<Card className="col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
					<CardContent className="pt-6">
						<div className="space-y-2">
							<div className="flex items-center">
								<span className="text-lg font-bold">Top Performer!</span>
								<span className="ml-1">🎉</span>
							</div>
							<p className="text-xs text-muted-foreground">
								Pandit Rajesh Sharma
							</p>
							<div className="pt-2">
								<span className="text-2xl font-bold">₹1,52,319</span>
								<div className="flex items-center text-xs text-green-600">
									<ArrowUpRight className="h-3 w-3 mr-1" />
									<span>+15% from last month</span>
								</div>
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
								<div className="flex items-center text-xs text-green-600">
									<span>+23%</span>
									<span className="text-[10px] ml-1">from last month</span>
								</div>
							</div>
							<div className="text-2xl font-bold pb-1">₹12,52,310</div>
							<MiniChart data={revenueData} color="#1E40AF" />
						</div>
					</CardContent>
				</Card>

				{/* Bookings Card */}
				<Card className="col-span-1">
					<CardContent className="pt-6">
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Bookings</span>
								<div className="flex items-center text-xs text-red-600">
									<span>-7%</span>
									<span className="text-[10px] ml-1">from last month</span>
								</div>
							</div>
							<div className="text-2xl font-bold pb-1">892</div>
							<MiniChart data={bookingsData} color="#1E40AF" />
						</div>
					</CardContent>
				</Card>

				{/* New Users Card */}
				<Card className="col-span-1">
					<CardContent className="pt-6">
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">New Users</span>
								<div className="flex items-center text-xs text-green-600">
									<span>+65%</span>
									<span className="text-[10px] ml-1">from last month</span>
								</div>
							</div>
							<div className="text-2xl font-bold pb-1">3,602</div>
							<MiniChart data={newUsersData} color="#1E40AF" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Middle Section */}
			<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
				{/* Revenue Section */}
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
									<p className="text-2xl font-semibold">248</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-muted-foreground">Temple Visits</p>
									<p className="text-2xl font-semibold">189</p>
								</div>
								<div className="ml-auto text-right">
									<p className="text-sm text-muted-foreground">
										Returning Users
									</p>
									<div className="flex items-center justify-end">
										<p className="text-2xl font-semibold">42%</p>
										<Badge className="ml-2 bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
											+25%
										</Badge>
									</div>
								</div>
							</div>

							<div className="h-[250px] pt-4">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={monthlyBarData}
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
											tickFormatter={(value) => `${value}k`}
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
											formatter={(value) => [`${value}`, "Value"]}
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

				{/* Revenue Chart */}
				<div className="col-span-12 md:col-span-4">
					<Card className="h-full">
						<CardContent className="p-0">
							<div className="h-[350px] pt-6">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart
										data={yearlyLineData}
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
										/>
										<Line
											type="monotone"
											dataKey="current"
											stroke="#000000"
											strokeWidth={2}
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="previous"
											stroke="#9CA3AF"
											strokeWidth={2}
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="target"
											stroke="#E5E7EB"
											strokeWidth={2}
											dot={false}
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
				<div className="col-span-12 md:col-span-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div>
								<CardTitle className="text-base">
									Bookings by Location
								</CardTitle>
								<CardDescription className="text-xs">
									Past 28 days activity
								</CardDescription>
							</div>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<span className="sr-only">Export</span>
								<Download className="h-4 w-4" />
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{bookingsByLocation.map((location, index) => (
									<div key={index} className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												{location.name}
											</span>
											<div className="flex items-center">
												<span className="text-sm font-medium">
													{location.percent}%
												</span>
												<span
													className={`ml-2 text-xs ${
														location.change.startsWith("+")
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{location.change}
												</span>
											</div>
										</div>
										<Progress value={location.percent} className="h-2" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Visitor Sources */}
				<div className="col-span-12 md:col-span-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div>
								<CardTitle className="text-base">Visitor Sources</CardTitle>
								<CardDescription></CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<div className="h-[300px] relative">
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="relative h-[180px] w-[180px]">
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="text-center">
												<div className="text-3xl font-bold">10.2K</div>
												<div className="text-sm text-muted-foreground">
													Visitors
												</div>
											</div>
										</div>
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={[
														{
															name: "Direct",
															value: visitorSourceData.direct,
															fill: "#000000",
														},
														{
															name: "Social",
															value: visitorSourceData.social,
															fill: "#6B7280",
														},
														{
															name: "Referral",
															value: visitorSourceData.referral,
															fill: "#D1D5DB",
														},
														{
															name: "Search",
															value: visitorSourceData.search,
															fill: "#9CA3AF",
														},
														{
															name: "Other",
															value: visitorSourceData.other,
															fill: "#F3F4F6",
														},
													]}
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
									<div className="grid grid-cols-5 gap-2 text-center text-xs">
										<div>
											<div className="flex justify-center">
												<div className="h-3 w-3 rounded-full bg-black"></div>
											</div>
											<span>Direct</span>
										</div>
										<div>
											<div className="flex justify-center">
												<div className="h-3 w-3 rounded-full bg-gray-500"></div>
											</div>
											<span>Social</span>
										</div>
										<div>
											<div className="flex justify-center">
												<div className="h-3 w-3 rounded-full bg-gray-300"></div>
											</div>
											<span>Referral</span>
										</div>
										<div>
											<div className="flex justify-center">
												<div className="h-3 w-3 rounded-full bg-gray-400"></div>
											</div>
											<span>Search</span>
										</div>
										<div>
											<div className="flex justify-center">
												<div className="h-3 w-3 rounded-full bg-gray-100"></div>
											</div>
											<span>Other</span>
										</div>
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
									Based on 5,500 verified services
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" className="h-8 gap-1">
								<span>View All</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Rating Distribution */}
								<div className="space-y-2">
									{customerReviews.distribution.map((rating) => (
										<div key={rating.stars} className="flex items-center gap-2">
											<div className="w-10 text-sm text-right">
												{rating.stars} ★
											</div>
											<Progress
												value={(rating.count / 5000) * 100}
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
										<div className="text-4xl font-bold">4.5</div>
										<div className="flex items-center justify-center">
											{[1, 2, 3, 4, 5].map((star) => (
												<Star
													key={star}
													className={`h-4 w-4 ${
														star <= 4
															? "fill-primary text-primary"
															: "fill-muted text-muted-foreground"
													} ${
														star === 5
															? "fill-primary text-primary opacity-50"
															: ""
													}`}
												/>
											))}
										</div>
										<div className="text-xs text-muted-foreground">
											out of 5
										</div>
									</div>
								</div>

								{/* Featured Review */}
								<div className="mt-4 pt-4 border-t">
									<div className="space-y-2">
										<div className="flex items-center">
											{[1, 2, 3, 4, 5].map((star) => (
												<Star
													key={star}
													className="h-3 w-3 fill-amber-400 text-amber-400"
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
											<span className="font-medium">
												{customerReviews.featured.author}
											</span>
											{customerReviews.featured.verified && (
												<span className="ml-2 text-green-600">
													Verified Purchase
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Recent Bookings */}
				<div className="col-span-12 md:col-span-6">
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
										placeholder="Filter bookings..."
										className="max-w-sm h-8 text-sm"
									/>
								</div>
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
										{recentBookings.slice(0, 6).map((booking) => (
											<tr key={booking.id} className="border-b border-gray-100">
												<td className="px-2 py-2 font-medium">{booking.id}</td>
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
															booking.status === "Processing"
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
									<div>Showing 1 to 6 of 10 entries</div>
									<div className="flex items-center gap-1">
										<Button variant="ghost" size="icon" className="h-7 w-7">
											<ChevronLeft className="h-4 w-4" />
											<span className="sr-only">Previous</span>
										</Button>
										<Button variant="ghost" size="icon" className="h-7 w-7">
											<ChevronRight className="h-4 w-4" />
											<span className="sr-only">Next</span>
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Top Selling Items */}
				<div className="col-span-12 md:col-span-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-base">Top Selling Items</CardTitle>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<Download className="h-4 w-4" />
								<span className="sr-only">Export</span>
							</Button>
						</CardHeader>
						<CardContent>
							<div className="relative">
								<div className="mb-3">
									<Input
										placeholder="Filter products..."
										className="max-w-sm h-8 text-sm"
									/>
								</div>
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
										{topSellingItems.slice(0, 6).map((product, i) => (
											<tr key={i} className="border-b border-gray-100">
												<td className="px-4 py-2">
													<div className="flex items-center gap-3">
														<div className="flex items-center justify-center h-9 w-9 rounded bg-muted">
															{product.image ? (
																<span className="text-lg">{product.image}</span>
															) : (
																<span className="h-5 w-5 bg-foreground/20 rounded" />
															)}
														</div>
														<span>{product.product}</span>
													</div>
												</td>
												<td className="px-4 py-2 text-right">{product.sold}</td>
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
									<div>Showing 1 to 6 of 8 entries</div>
									<div className="flex items-center gap-1">
										<Button variant="ghost" size="icon" className="h-7 w-7">
											<ChevronLeft className="h-4 w-4" />
											<span className="sr-only">Previous</span>
										</Button>
										<Button variant="ghost" size="icon" className="h-7 w-7">
											<ChevronRight className="h-4 w-4" />
											<span className="sr-only">Next</span>
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
