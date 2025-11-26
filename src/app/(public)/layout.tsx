import React from "react";
import Sidebar from "../../components/Sidebar";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen w-full bg-custom-bg text-[15px]">
            <Sidebar />
            <main className="flex-1 text-[15px]">{children}</main>
        </div>
    );
}
