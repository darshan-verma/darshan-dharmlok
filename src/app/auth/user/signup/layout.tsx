import { ReactNode } from "react";

export default function UserSignUpLayout({ children }: { children: ReactNode }) {
	// The AuthComponent handles its own layout, so we just pass through
	return <>{children}</>;
}
