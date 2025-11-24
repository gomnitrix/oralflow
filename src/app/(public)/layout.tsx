import React from "react";
import Sidebar from "../../components/Sidebar";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen w-full bg-custom-bg">
            <Sidebar />
            <main className="flex-1">{children}</main>
        </div>
    );
}
