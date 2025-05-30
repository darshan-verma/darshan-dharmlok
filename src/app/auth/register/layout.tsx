import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-md mx-auto">
					<div className="bg-white rounded-lg shadow-md p-8">{children}</div>
				</div>
			</div>
		</div>
	);
}
