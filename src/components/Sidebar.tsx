"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="sticky top-0 flex h-screen flex-col justify-between border-r border-custom-border bg-white p-5 w-[270px] hidden lg:flex text-[15px]">
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3 px-3">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                        style={{
                            backgroundImage:
                                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCIuu5MGLYKRPxdWpL2b9hpaMLb9B08w1B6TCzcOiJASraTFFzgbYAbJ0ctAA_hvm4J7WD2cFGHANLr5KwlwPEMrwO7G6twy04z1EtaoeRK39B3rg8ySBxCxeZ3Mv37FVBPIPKwLncNr85VA3Fq7-JjbWMZMBcIm2U69wmIZFW1FGcvthJOq0K-ZwvTV0QfEaVeW8LZYY2UWW06gtY0eX9ShL0kjEAQ6LgLH9OAsBf-jvMbxhVeEUTzxXVffJNTMi0AyqF8h2c2Byk")',
                        }}
                    ></div>
                    <h1 className="text-custom-text-dark text-xl font-bold">OralFlow</h1>
                </div>
                <nav className="flex flex-col gap-2 text-[15px]">
                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-4 py-2 rounded-full transition-colors ${isActive("/")
                            ? "bg-custom-primary/20 text-custom-primary"
                            : "hover:bg-custom-primary/10 text-custom-text-dark"
                            }`}
                    >
                        <span
                            className={`material-symbols-outlined ${isActive("/") ? "fill" : ""
                                }`}
                        >
                            home
                        </span>
                        <p className={`text-sm ${isActive("/") ? "font-bold" : "font-medium"}`}>
                            Home
                        </p>
                    </Link>
                    <Link
                        href="/scenarios"
                        className={`flex items-center gap-3 px-4 py-2 rounded-full transition-colors ${isActive("/scenarios")
                            ? "bg-custom-primary/20 text-custom-primary"
                            : "hover:bg-custom-primary/10 text-custom-text-dark"
                            }`}
                    >
                        <span className="material-symbols-outlined">smart_toy</span>
                        <p className={`text-sm ${isActive("/scenarios") ? "font-bold" : "font-medium"}`}>
                            Scenarios
                        </p>
                    </Link>
                    <Link
                        href="/ask"
                        className={`flex items-center gap-3 px-4 py-2 rounded-full transition-colors ${isActive("/ask")
                            ? "bg-custom-primary/20 text-custom-primary"
                            : "hover:bg-custom-primary/10 text-custom-text-dark"
                            }`}
                    >
                        <span className="material-symbols-outlined">help_center</span>
                        <p className={`text-sm ${isActive("/ask") ? "font-bold" : "font-medium"}`}>
                            Ask
                        </p>
                    </Link>
                    <Link
                        href="/notebook"
                        className={`flex items-center gap-3 px-4 py-2 rounded-full transition-colors ${isActive("/notebook")
                            ? "bg-custom-primary/20 text-custom-primary"
                            : "hover:bg-custom-primary/10 text-custom-text-dark"
                            }`}
                    >
                        <span className="material-symbols-outlined">book_2</span>
                        <p className={`text-sm ${isActive("/notebook") ? "font-bold" : "font-medium"}`}>
                            Notebook
                        </p>
                    </Link>
                    <Link
                        href="/models"
                        className={`flex items-center gap-3 px-4 py-2 rounded-full transition-colors ${isActive("/models")
                            ? "bg-custom-primary/20 text-custom-primary"
                            : "hover:bg-custom-primary/10 text-custom-text-dark"
                            }`}
                    >
                        <span className="material-symbols-outlined">settings_suggest</span>
                        <p className={`text-sm ${isActive("/models") ? "font-bold" : "font-medium"}`}>
                            Models
                        </p>
                    </Link>
                </nav>
            </div>
            <div className="flex flex-col gap-2">
                <div className="border-t border-custom-border -mx-4 mb-2"></div>
                <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-custom-primary/10 transition-colors"
                >
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8"
                        style={{
                            backgroundImage:
                                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAJ2Lt5Is3j3zzLp6vfyAeSDPkuwVyN1TikoD11G1X60UMj5nqkfIDUBp_oAXF-MZdhXNBSUWK2Ib4KjnZy6wrUcnWppKaHaNEkjTnQkrqTVLONf053bN4Eg4JPMJRXUIypbufc6qHnahkv46HZYaEuveOMj1Bntu2va3mzNsvpTxg65SL0LeANXFrtDwqGtxvzdRKOrxdTQ-KgF9mX7yx8fVd0fnUJTPeOrW8M1_wtK9IfivNuYpWkne2rNXRtVBXMwF7eRsa6-To")',
                        }}
                    ></div>
                    <p className="text-custom-text-dark text-sm font-medium">Profile</p>
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
