// src/app/api/check-db/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
	try {
		const db = await connectDB();

		// Check if the connection is ready
		const isConnected = db.connection.readyState === 1;

		return NextResponse.json({
			status: isConnected ? "connected" : "disconnected",
			dbState: db.connection.readyState,
			dbName: db.connection.name,
			dbHost: db.connection.host,
			dbPort: db.connection.port,
		});
	} catch (error) {
		console.error("Database connection error:", error as Error);
		return NextResponse.json(
			{ error: "Database connection failed", details: (error as Error).message },
			{ status: 500 }
		);
	}
}
