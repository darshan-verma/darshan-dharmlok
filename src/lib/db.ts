// src/lib/db.ts
import mongoose from "mongoose";

// Cache the connection to prevent multiple connections in development
// treat global as any just here
let cached = (global as any).mongoose;

if (!cached) {
	cached = (global as any).mongoose = { conn: null, promise: null };
}


export const connectDB = async (): Promise<typeof mongoose> => {
	// Return cached connection if available
	if (cached.conn) {
		console.log("Using existing database connection");
		return cached.conn;
	}

	if (!process.env.MONGODB_URI) {
		throw new Error("MONGODB_URI environment variable is not defined");
	}

	// Create new connection if none exists
	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose
			.connect(process.env.MONGODB_URI, opts)
			.then((mongoose) => {
				return mongoose;
			});
	}

	try {
		cached.conn = await cached.promise;

		// Connection events
		mongoose.connection.on("connected", () => {
			console.log("Mongoose connected to DB");
		});

		mongoose.connection.on("error", (err) => {
			console.error("Mongoose connection error:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("Mongoose disconnected");
		});

		// Close the connection when the Node process ends
		process.on("SIGINT", async () => {
			await mongoose.connection.close();
			console.log("Mongoose connection closed through app termination");
			process.exit(0);
		});

		return cached.conn;
	} catch (error) {
		console.error("Database connection error:", error);
		throw new Error("Failed to connect to the database");
	}
};

// Export mongoose instance for direct use if needed
export const db = mongoose;
