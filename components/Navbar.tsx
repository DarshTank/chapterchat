'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { User as UserIcon, LogOut, Menu, X, PlusCircle, BookOpen, ShieldCheck } from "lucide-react";
import TransparentLogo from "@/components/TransparentLogo";

const Navbar = () => {
    const pathName = usePathname();
    const { user, isSignedIn, logout, loading } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'darshtank05@gmail.com';

    const navItems = isAdmin
        ? [{ label: "Admin Panel", href: "/admin", icon: ShieldCheck }]
        : [
            { label: isSignedIn ? "Library" : "Home", href: "/", icon: BookOpen },
            { label: "Add New", href: "/books/new", icon: PlusCircle },
        ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathName]);

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [user?.image]);

    return (
        <header className="w-full fixed top-0 left-0 z-50 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#e7ded0] shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand Logo */}
                <div className="shrink-0">
                    <TransparentLogo size="md" />
                </div>

                {/* DESKTOP NAVIGATION (Medium screens & above) */}
                <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                    {navItems.map(({ label, href }) => {
                        const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));

                        return (
                            <Link
                                href={href}
                                key={label}
                                className={cn(
                                    'text-sm font-semibold transition-colors py-1 border-b-2',
                                    isActive
                                        ? 'text-[#663820] font-bold border-[#663820]'
                                        : 'text-stone-600 border-transparent hover:text-[#663820]'
                                )}
                            >
                                {label}
                            </Link>
                        );
                    })}

                    {/* Desktop User Account Profile Dropdown */}
                    <div className="flex items-center gap-3 pl-2 border-l border-[#e7ded0]">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />
                        ) : isSignedIn && user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2.5 p-1 rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer"
                                >
                                    {user.image && !imageError ? (
                                        <div className="relative w-8.5 h-8.5 rounded-full overflow-hidden shrink-0 border border-[#663820]/30 bg-stone-100">
                                            <Image
                                                src={user.image}
                                                alt={user.name || 'User'}
                                                fill
                                                sizes="34px"
                                                className="object-cover"
                                                onError={() => setImageError(true)}
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8.5 h-8.5 rounded-full bg-[#663820] text-white font-bold flex items-center justify-center text-sm shadow-xs border border-[#663820] shrink-0">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <span className="text-sm font-bold text-[#212a3b] hidden lg:inline-block truncate max-w-[120px]">
                                        {user.name ? user.name.split(" ")[0] : ''}
                                    </span>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white text-[#212a3b] border border-[#e7ded0] rounded-2xl shadow-xl pt-2 pb-0 overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
                                        <div className="px-4 py-2.5 border-b border-stone-100">
                                            <p className="text-sm font-bold text-[#663820] truncate">{user.name}</p>
                                            <p className="text-xs text-stone-500 truncate">{user.email}</p>
                                        </div>

                                        <Link
                                            href="/profile"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#f8f4e9] hover:text-[#663820] transition-colors"
                                        >
                                            <UserIcon size={16} />
                                            <span>Profile & Security</span>
                                        </Link>

                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors"
                                            >
                                                <ShieldCheck size={16} className="text-[#663820]" />
                                                <span>Admin Panel</span>
                                            </Link>
                                        )}

                                        <div className="border-t border-stone-100" />

                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                logout();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-b-2xl transition-colors text-left cursor-pointer"
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/sign-in"
                                    className="px-3.5 py-1.5 text-xs font-bold text-stone-700 hover:text-[#663820] transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="px-4 py-1.5 text-xs font-bold bg-[#663820] hover:bg-[#7a4528] text-white rounded-xl transition-all shadow-xs"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* MOBILE MENU HAMBURGER BUTTON (Visible on small screens) */}
                <div className="flex items-center gap-2 md:hidden">
                    {isSignedIn && user && (
                        <div className="w-8 h-8 rounded-full bg-[#663820] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl text-stone-700 hover:text-[#663820] hover:bg-stone-100 transition-colors cursor-pointer"
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* MOBILE SLIDE-DOWN NAVIGATION DRAWER */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-[#e7ded0] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                        {navItems.map(({ label, href, icon: Icon }) => {
                            const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));

                            return (
                                <Link
                                    href={href}
                                    key={label}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
                                        isActive
                                            ? 'bg-[#663820] text-white shadow-xs'
                                            : 'text-stone-700 hover:bg-[#f8f4e9] hover:text-[#663820]'
                                    )}
                                >
                                    <Icon size={18} />
                                    <span>{label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-stone-100">
                        {isSignedIn && user ? (
                            <div className="space-y-2">
                                <div className="px-4 py-2 bg-[#f8f4e9] rounded-xl border border-[#e7ded0]">
                                    <p className="text-xs font-bold text-[#663820] truncate">{user.name}</p>
                                    <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                                </div>

                                <Link
                                    href="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100"
                                >
                                    <UserIcon size={16} />
                                    <span>Profile & Security</span>
                                </Link>

                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 pt-1">
                                <Link
                                    href="/sign-in"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-2.5 text-center text-sm font-bold text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-up"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-2.5 text-center text-sm font-bold bg-[#663820] text-white rounded-xl hover:bg-[#7a4528]"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
