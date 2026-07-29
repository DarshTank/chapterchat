"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "@/lib/actions/auth.actions";

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    image?: string;
    isVerified: boolean;
    googleId?: string;
    hasPassword?: boolean;
    createdAt?: string;
    role?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    userId: string | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userId: null,
    loading: false,
    logout: async () => {},
    refreshUser: async () => {},
    isSignedIn: false,
});

interface AuthProviderProps {
    children: React.ReactNode;
    initialUser?: AuthUser | null;
}

export const AuthProvider = ({ children, initialUser = null }: AuthProviderProps) => {
    const [user, setUser] = useState<AuthUser | null>(initialUser);
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            const data = await res.json();
            setUser(data.user || null);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [pathname]);

    const logout = async () => {
        await logoutUser();
        setUser(null);
        router.push("/sign-in");
        router.refresh();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userId: user?._id || null,
                loading,
                logout,
                refreshUser: fetchUser,
                isSignedIn: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export const useUser = () => {
    const { user, loading, isSignedIn } = useContext(AuthContext);
    return { user, isLoaded: !loading, isSignedIn };
};

