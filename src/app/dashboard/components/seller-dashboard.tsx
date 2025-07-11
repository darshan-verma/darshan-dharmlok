"use client";
import React, { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// --- Type Definitions ---
export interface Seller {
	id: string;
	name: string;
	avatarUrl?: string;
	rating: number;
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
function useMockFetch<T>(fetcher: () => Promise<T>, deps: any[] = []) {
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

// Seller Info Card
function SellerInfo({ seller }: { seller: Seller }) {
	return (
		<Card className="flex flex-row items-center gap-4 p-4">
			<Avatar className="h-16 w-16">
				{seller.avatarUrl ? (
					<AvatarImage src={seller.avatarUrl} alt={seller.name} />
				) : (
					<AvatarFallback>{seller.name[0]}</AvatarFallback>
				)}
			</Avatar>
			<div className="flex flex-col gap-1">
				<span className="font-semibold text-lg">{seller.name}</span>
				<span className="text-sm text-muted-foreground">Seller</span>
				<div className="flex items-center gap-1 mt-1">
					<Badge variant="secondary">⭐ {seller.rating.toFixed(2)}</Badge>
				</div>
			</div>
		</Card>
	);
}

// KPI Card
function StatsCard({ kpi }: { kpi: KPI }) {
	return (
		<Card className="flex-1 min-w-[140px]">
			<CardHeader className="pb-2 flex flex-row items-center justify-between">
				<CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
				{kpi.icon}
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				<span className="text-2xl font-bold">{kpi.value}</span>
				{kpi.trend && (
					<span
						className={`text-xs ${
							kpi.trend === "up" ? "text-green-600" : "text-red-600"
						}`}
					>
						{kpi.trend === "up" ? "▲" : "▼"} {kpi.trendValue}%
					</span>
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
		<Card className="col-span-2">
			<CardHeader>
				<CardTitle>Sales Over Time</CardTitle>
				<CardDescription>Last 30 days</CardDescription>
			</CardHeader>
			<CardContent className="h-64">
				{loading ? (
					<Skeleton className="w-full h-full rounded" />
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={data}
							margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
									<stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
								</linearGradient>
							</defs>
							<XAxis dataKey="date" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} />
							<Tooltip />
							<Area
								type="monotone"
								dataKey="sales"
								stroke="#6366f1"
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
	// Simulate async fetches
	const { data: seller, loading: sellerLoading } = useMockFetch(async () => {
		await new Promise((r) => setTimeout(r, 600));
		return {
			id: "seller-1",
			name: "Amit Sharma",
			avatarUrl: undefined,
			rating: 4.82,
		};
	}, []);

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

	// --- Layout ---
	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Top Row: Seller Info + KPIs */}
			<div className="flex flex-col md:flex-row gap-4 w-full">
				<div className="md:w-1/4 w-full">
					{sellerLoading || !seller ? (
						<Skeleton className="h-32 w-full rounded" />
					) : (
						<SellerInfo seller={seller} />
					)}
				</div>
				<div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
					{kpiLoading || !kpis
						? Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-24 w-full rounded" />
						  ))
						: kpis.map((kpi, i) => <StatsCard key={i} kpi={kpi} />)}
				</div>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
				<SalesChart data={salesData || []} loading={salesLoading} />
				<div className="flex flex-col gap-4">
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
