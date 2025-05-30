import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-md mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900">Dharmlok</h1>
						<p className="mt-2 text-gray-600">Create your admin account</p>
					</div>
					<div className="bg-white rounded-lg shadow-md p-8">{children}</div>
				</div>
			</div>
		</div>
	);
}
