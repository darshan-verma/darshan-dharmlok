"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { userService } from "@/services/userService";
import type { FullUser } from "@/types/user";
import SellerProfileForm from "./seller-profile-form";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	Package,
	ShoppingCart,
	Users,
	BarChart3,
} from "lucide-react";

// --- Type Definitions ---
export interface Seller {
	id: string;
	name: string;
	avatarUrl?: string;
	rating: number;
	category?: string;
}

export interface KPI {
	label: string;
	value: number | string;
	trend?: "up" | "down";
	trendValue?: number;
	icon?: React.ReactNode;
}

export interface SalesDataPoint {
	date: string;
	sales: number;
}

export interface CategorySalesData {
	category: string;
	sales: number;
}

export interface OrderStatusData {
	status: string;
	value: number;
}

export interface Order {
	id: string;
	date: string;
	product: string;
	buyer: string;
	status: "Completed" | "Pending" | "Cancelled";
	amount: number;
}

// --- Mock API Utilities ---
function useMockFetch<T>(
	fetcher: () => Promise<T>,
	deps: React.DependencyList = []
) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		setLoading(true);
		fetcher().then((d) => {
			setData(d);
			setLoading(false);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return { data, loading };
}

// --- Subcomponents ---

// KPI Card
function StatsCard({ kpi }: { kpi: KPI }) {
	const iconMap: Record<string, React.ReactNode> = {
		"Total Sales": <ShoppingCart className="h-5 w-5 text-blue-600" />,
		"Active Listings": <Package className="h-5 w-5 text-green-600" />,
		"Pending Orders": <Users className="h-5 w-5 text-orange-600" />,
		Revenue: <DollarSign className="h-5 w-5 text-purple-600" />,
	};

	return (
		<Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
			<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
				<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
					{kpi.label}
				</CardTitle>
				{iconMap[kpi.label] || kpi.icon}
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="text-2xl font-bold text-gray-900 dark:text-white">
					{kpi.value}
				</div>
				{kpi.trend && (
					<div
						className={`flex items-center text-xs ${
							kpi.trend === "up" ? "text-green-600" : "text-red-600"
						}`}
					>
						{kpi.trend === "up" ? (
							<TrendingUp className="h-3 w-3 mr-1" />
						) : (
							<TrendingDown className="h-3 w-3 mr-1" />
						)}
						<span>{kpi.trendValue}% from last month</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Sales Over Time Chart
function SalesChart({
	data,
	loading,
}: {
	data: SalesDataPoint[];
	loading: boolean;
}) {
	return (
		<Card className="col-span-2 hover:shadow-lg transition-shadow duration-200">
			<CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-blue-600" />
					<CardTitle>Sales Performance</CardTitle>
				</div>
				<CardDescription>Sales trends over the last 30 days</CardDescription>
			</CardHeader>
			<CardContent className="p-6">
				{loading ? (
					<Skeleton className="w-full h-64 rounded" />
				) : (
					<ResponsiveContainer width="100%" height={280}>
						<AreaChart
							data={data}
							margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
									<stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
								</linearGradient>
							</defs>
							<XAxis
								dataKey="date"
								tick={{ fontSize: 12 }}
								tickLine={{ stroke: "#e5e7eb" }}
								axisLine={{ stroke: "#e5e7eb" }}
							/>
							<YAxis
								tick={{ fontSize: 12 }}
								tickLine={{ stroke: "#e5e7eb" }}
								axisLine={{ stroke: "#e5e7eb" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#fff",
									border: "1px solid #e5e7eb",
									borderRadius: "8px",
									boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
								}}
							/>
							<Area
								type="monotone"
								dataKey="sales"
								stroke="#6366f1"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#colorSales)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}

// Category Sales Bar Chart
function CategorySalesBar({
	data,
	loading,
}: {
	data: CategorySalesData[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Sales by Category</CardTitle>
			</CardHeader>
			<CardContent className="h-64">
				{loading ? (
					<Skeleton className="w-full h-full rounded" />
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} layout="vertical" margin={{ left: 20 }}>
							<XAxis type="number" hide />
							<YAxis
								dataKey="category"
								type="category"
								width={100}
								tick={{ fontSize: 12 }}
							/>
							<Tooltip />
							<Bar dataKey="sales" fill="#6366f1" radius={[0, 8, 8, 0]} />
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}

// Order Status Pie Chart
const STATUS_COLORS: Record<string, string> = {
	Completed: "#22c55e",
	Pending: "#fbbf24",
	Cancelled: "#ef4444",
};
function OrderStatusPie({
	data,
	loading,
}: {
	data: OrderStatusData[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Order Status</CardTitle>
			</CardHeader>
			<CardContent className="h-64 flex items-center justify-center">
				{loading ? (
					<Skeleton className="w-40 h-40 rounded-full" />
				) : (
					<ResponsiveContainer width={200} height={200}>
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								nameKey="status"
								cx="50%"
								cy="50%"
								outerRadius={80}
								innerRadius={50}
								label={({ name, percent }) =>
									`${name}: ${(percent * 100).toFixed(0)}%`
								}
							>
								{data.map((entry, idx) => (
									<Cell
										key={`cell-${idx}`}
										fill={STATUS_COLORS[entry.status] || "#6366f1"}
									/>
								))}
							</Pie>
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}

// Recent Orders Table
function OrdersTable({
	orders,
	loading,
}: {
	orders: Order[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Orders</CardTitle>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Product</TableHead>
							<TableHead>Buyer</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading
							? Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={5}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
							  ))
							: orders.map((order) => (
									<TableRow key={order.id}>
										<TableCell>{order.date}</TableCell>
										<TableCell>{order.product}</TableCell>
										<TableCell>{order.buyer}</TableCell>
										<TableCell>
											<Badge
												variant={
													order.status === "Completed"
														? "default"
														: order.status === "Pending"
														? "secondary"
														: "destructive"
												}
											>
												{order.status}
											</Badge>
										</TableCell>
										<TableCell>
											₹{order.amount.toLocaleString("en-IN")}
										</TableCell>
									</TableRow>
							  ))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

// --- Main SellerDashboard Component ---
export default function SellerDashboard() {
	// Get session for real user profile image
	const { data: session } = useSession();
	const [seller, setSeller] = useState<Seller | null>(null);
	const [sellerLoading, setSellerLoading] = useState(true);
	useEffect(() => {
		async function fetchSellerProfile() {
			if (session?.user?.id) {
				setSellerLoading(true);
				try {
					const user = (await userService.getUserById(
						session.user.id
					)) as FullUser;
					setSeller({
						id: user.id,
						name: user.name || "Seller",
						avatarUrl: user.profileImageUrl || undefined,
						rating: 4.82, // TODO: Replace with real rating if available
						category: user.category || "E-commerce Seller",
					});
				} catch {
					setSeller({
						id: session.user.id,
						name: session.user.name || "Seller",
						avatarUrl: session.user.image || undefined,
						rating: 4.82,
						category: "E-commerce Seller",
					});
				} finally {
					setSellerLoading(false);
				}
			} else {
				setSeller({
					id: "seller-1",
					name: "Amit Sharma",
					avatarUrl: undefined,
					rating: 4.82,
					category: "E-commerce Seller",
				});
				setSellerLoading(false);
			}
		}
		fetchSellerProfile();
	}, [session]);

	const { data: kpis, loading: kpiLoading } = useMockFetch(async () => {
		await new Promise((r) => setTimeout(r, 700));
		return [
			{
				label: "Total Sales",
				value: 1240,
				trend: "up" as const,
				trendValue: 8.2,
			},
			{ label: "Active Listings", value: 32 },
			{
				label: "Pending Orders",
				value: 5,
				trend: "down" as const,
				trendValue: 2.1,
			},
			{
				label: "Revenue",
				value: "₹2,34,000",
				trend: "up" as const,
				trendValue: 5.6,
			},
		];
	}, []);

	const { data: salesData, loading: salesLoading } = useMockFetch(async () => {
		await new Promise((r) => setTimeout(r, 800));
		// 30 days
		const today = new Date();
		return Array.from({ length: 30 }).map((_, i) => {
			const d = new Date(today);
			d.setDate(today.getDate() - (29 - i));
			return {
				date: d.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
				sales: Math.floor(Math.random() * 1000 + 200),
			};
		});
	}, []);

	const { data: categorySales, loading: catSalesLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 900));
			return [
				{ category: "Books", sales: 3200 },
				{ category: "Clothing", sales: 2100 },
				{ category: "Accessories", sales: 1800 },
				{ category: "Spiritual", sales: 1500 },
				{ category: "Food", sales: 900 },
			];
		}, []);

	const { data: orderStatus, loading: statusLoading } =
		useMockFetch(async () => {
			await new Promise((r) => setTimeout(r, 1000));
			return [
				{ status: "Completed", value: 82 },
				{ status: "Pending", value: 10 },
				{ status: "Cancelled", value: 8 },
			];
		}, []);

	const { data: orders, loading: ordersLoading } = useMockFetch(async () => {
		await new Promise((r) => setTimeout(r, 1100));
		return Array.from({ length: 8 }).map((_, i) => ({
			id: `order-${i + 1}`,
			date: new Date(Date.now() - i * 86400000).toLocaleDateString("en-IN", {
				month: "short",
				day: "2-digit",
			}),
			product: ["Book", "Kurta", "Mala", "Incense", "Shawl"][i % 5],
			buyer: ["Rohit", "Priya", "Suresh", "Anjali", "Deepak"][i % 5],
			status: ["Completed", "Pending", "Cancelled"][i % 3] as Order["status"],
			amount: Math.floor(Math.random() * 2000 + 200),
		}));
	}, []);

	// Handle profile save to refresh data
	const handleProfileSave = async (_data?: unknown) => {
		// Ignore passed data and refetch the profile to get the updated data including new image
		if (session?.user?.id) {
			try {
				const user = (await userService.getUserById(
					session.user.id
				)) as FullUser;
				setSeller({
					id: user.id,
					name: user.name || "Seller",
					avatarUrl: user.profileImageUrl || undefined,
					rating: 4.82, // TODO: Replace with real rating if available
					category: user.category || "E-commerce Seller",
				});
			} catch (error) {
				console.error("Failed to refresh profile:", error);
			}
		}
	};

	// --- Layout ---
	return (
		<div className="flex flex-col gap-8 w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
			{/* Top Row: Seller Profile + KPIs */}
			<div className="flex flex-col xl:flex-row gap-6 w-full">
				<div className="xl:w-2/5 w-full">
					<SellerProfileForm
						profile={
							seller
								? {
										id: seller.id,
										name: seller.name,
										email: "",
										phone: "",
										addresses: [],
										profileImageUrl: seller.avatarUrl,
								  }
								: null
						}
						loading={sellerLoading}
						onSave={handleProfileSave}
					/>
				</div>
				<div className="flex-1">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						{kpiLoading || !kpis
							? Array.from({ length: 4 }).map((_, i) => (
									<Skeleton key={i} className="h-32 w-full rounded" />
							  ))
							: kpis.map((kpi, i) => <StatsCard key={i} kpi={kpi} />)}
					</div>
				</div>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
				<div className="xl:col-span-2">
					<SalesChart data={salesData || []} loading={salesLoading} />
				</div>
				<div className="space-y-6">
					<CategorySalesBar
						data={categorySales || []}
						loading={catSalesLoading}
					/>
					<OrderStatusPie data={orderStatus || []} loading={statusLoading} />
				</div>
			</div>

			{/* Recent Orders Table */}
			<OrdersTable orders={orders || []} loading={ordersLoading} />
		</div>
	);
}

// --- Example Usage ---
// import SellerDashboard from "./seller-dashboard";
// <SellerDashboard />
