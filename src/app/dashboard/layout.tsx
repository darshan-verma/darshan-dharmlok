// import DashboardSidebar from "./components/sidebar";
// import { getServerSession } from "next-auth";
// import { PropsWithChildren } from "react";

// export default async function DashboardLayout({ children }: PropsWithChildren) {
//     const session = await getServerSession();
//     return (
//         <div style={{ display: "flex" }}>
//             <DashboardSidebar userType={session?.user.userType} />
//             <main style={{ flex: 1 }}>{children}</main>
//         </div>
//     );
// }