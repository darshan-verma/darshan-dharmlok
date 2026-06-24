import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getFareUpsell } from "@/lib/tboClient";

/**
 * POST /api/travel/fare-upsell
 * Proxy to TBO FareUpsell endpoint (server-side)
 * 
 * Note: FareUpsell may fail if:
 * - The flight doesn't actually support upsell (even if IsUpsellAllowed is true)
 * - The TraceId has expired
 * - The ResultIndex is invalid
 * - The supplier doesn't support upsell for that particular flight
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body || !body.TraceId || !body.ResultIndex) {
			return brandedFlightJson(
				{ success: false, error: "Missing TraceId or ResultIndex" },
				{ status: 400 }
			);
		}

		// Log the request for debugging
		console.log("📥 Fare Upsell Request:", {
			TraceId: body.TraceId,
			ResultIndex: body.ResultIndex,
			ReturnResultIndex: body.ReturnResultIndex,
		});

		// Ensure EndUserIp is provided (TBO expects it)
		const params: {
			TraceId: string;
			ResultIndex: string;
			EndUserIp: string;
			ReturnResultIndex?: string;
		} = {
			TraceId: body.TraceId,
			ResultIndex: body.ResultIndex,
			EndUserIp: body.EndUserIp || "192.168.1.1",
		};

		if (body.ReturnResultIndex)
			params.ReturnResultIndex = body.ReturnResultIndex;

		// Note: AdultCount, ChildCount, InfantCount are NOT part of FareUpsellRequest
		// TBO FareUpsell API doesn't accept passenger counts - it uses the original search parameters

		const result = await getFareUpsell(params);

		// Check if result has error inside Response object (TBO sometimes puts error here)
		// Type assertion needed because TBO response structure may vary
		const responseWithError = result?.Response as
			| { Error?: { ErrorCode: number; ErrorMessage: string } }
			| undefined;

		if (
			responseWithError?.Error &&
			responseWithError.Error.ErrorCode !== 0
		) {
			const errorMessage =
				responseWithError.Error.ErrorMessage || "Unknown error";
			const isSupplierError = errorMessage
				?.toLowerCase()
				.includes("supplier end");

			// Log detailed error for debugging
			if (isSupplierError) {
				console.warn("⚠️ Fare Upsell: Supplier doesn't support upsell", {
					TraceId: body.TraceId,
					ResultIndex: body.ResultIndex,
					ErrorMessage: errorMessage,
				});
			} else {
				console.error("❌ Fare Upsell API returned error:", {
					ErrorCode: responseWithError.Error.ErrorCode,
					ErrorMessage: errorMessage,
					TraceId: body.TraceId,
					ResultIndex: body.ResultIndex,
				});
			}

			// Return error response - but treat supplier errors as "not available" not "error"
			return brandedFlightJson(
				{
					success: false,
					error: isSupplierError
						? "Fare upsell is not available for this flight. The supplier does not support upsell options for this particular flight."
						: errorMessage,
					errorCode: responseWithError.Error.ErrorCode,
					errorType: isSupplierError ? "SUPPLIER_NOT_SUPPORTED" : "API_ERROR",
					data: result, // Include full response for debugging
				},
				{ status: 400 }
			);
		}

		// Check if result has error at top level (FareUpsellResponse has Error at top level)
		if (result?.Error && result.Error.ErrorCode !== 0) {
			const errorMessage = result.Error.ErrorMessage || "Unknown error";
			const isSupplierError = errorMessage
				?.toLowerCase()
				.includes("supplier end");

			// Log detailed error for debugging
			if (isSupplierError) {
				console.warn("⚠️ Fare Upsell: Supplier doesn't support upsell", {
					TraceId: body.TraceId,
					ResultIndex: body.ResultIndex,
					ErrorMessage: errorMessage,
				});
			} else {
				console.error("❌ Fare Upsell API returned error:", {
					ErrorCode: result.Error.ErrorCode,
					ErrorMessage: errorMessage,
					TraceId: body.TraceId,
					ResultIndex: body.ResultIndex,
				});
			}

			// Return error response - but treat supplier errors as "not available" not "error"
			return brandedFlightJson(
				{
					success: false,
					error: isSupplierError
						? "Fare upsell is not available for this flight. The supplier does not support upsell options for this particular flight."
						: errorMessage,
					errorCode: result.Error.ErrorCode,
					errorType: isSupplierError ? "SUPPLIER_NOT_SUPPORTED" : "API_ERROR",
					data: result, // Include full response for debugging
				},
				{ status: 400 }
			);
		}

		// Check if results are empty (no upsell options available)
		if (result?.Response?.Results && result.Response.Results.length === 0) {
			console.log("⚠️ Fare Upsell returned empty results - no upsell options available");
			return brandedFlightJson({
				success: true,
				data: result,
				message: "No fare upsell options available for this flight",
			});
		}

		console.log("✅ Fare Upsell successful:", {
			resultCount: result?.Response?.Results?.length || 0,
		});

		return brandedFlightJson({ success: true, data: result });
	} catch (error) {
		console.error("/api/travel/fare-upsell error:", error);
		
		const errorMessage = error instanceof Error ? error.message : String(error);
		
		// Provide more helpful error messages
		if (errorMessage.includes("FareUpsell failed from the Supplier end")) {
			return brandedFlightJson(
				{
					success: false,
					error: "Fare upsell is not available for this flight. The supplier does not support upsell options for this particular flight, even though it may show an upsell badge.",
					errorCode: "SUPPLIER_NOT_SUPPORTED",
				},
				{ status: 400 }
			);
		}

		return brandedFlightJson(
			{
				success: false,
				error: errorMessage,
			},
			{ status: 500 }
		);
	}
}
