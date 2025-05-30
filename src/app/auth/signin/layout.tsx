import { ReactNode } from "react";

export default function SignInLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900">Dharmlok</h1>
					<p className="mt-2 text-gray-600">Sign in to your admin account</p>
				</div>
				<div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{children}
				</div>
			</div>
		</div>
	);
}
