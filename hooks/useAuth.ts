"use client";

import { useAuth as useClientAuth, useUser as useClientUser } from "@/components/providers/AuthProvider";

export const useAuth = () => {
    const { userId, isSignedIn, loading, logout } = useClientAuth();
    return { userId, isLoaded: !loading, isSignedIn, signOut: logout };
};

export const useUser = () => {
    return useClientUser();
};
