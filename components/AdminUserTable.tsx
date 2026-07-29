"use client";

import React, { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, UserX, CheckCircle, Trash2, Ban, Unlock, AlertTriangle, Mail } from "lucide-react";
import { blockUserAdmin, unblockUserAdmin, deleteUserAdmin } from "@/lib/actions/admin.actions";
import { toast } from "sonner";

interface AdminUserTableProps {
    initialUsers: any[];
    initialStats: {
        totalUsers: number;
        activeUsers: number;
        blockedUsers: number;
        totalBooks: number;
    };
}

export default function AdminUserTable({ initialUsers, initialStats }: AdminUserTableProps) {
    const [users, setUsers] = useState<any[]>(initialUsers);
    const [stats, setStats] = useState(initialStats);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Modal state for blocking user
    const [blockModalUser, setBlockModalUser] = useState<any | null>(null);
    const [blockReason, setBlockReason] = useState("");

    // Modal state for deleting user
    const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
    const [deleteReason, setDeleteReason] = useState("");

    // Filter users dynamically (excluding primary admin)
    const filteredUsers = users.filter((u) =>
        u.email.toLowerCase() !== "darshtank05@gmail.com" &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleBlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blockModalUser) return;

        setLoadingId(blockModalUser._id);
        const toastId = toast.loading(`Suspending user and sending notification email...`);

        try {
            const res = await blockUserAdmin(blockModalUser._id, blockReason);
            if (res.success) {
                toast.success(res.message, { id: toastId });
                setUsers((prev) =>
                    prev.map((u) =>
                        u._id === blockModalUser._id
                            ? { ...u, isBlocked: true, blockedReason: blockReason || "Suspended by admin" }
                            : u
                    )
                );
                setStats((prev) => ({
                    ...prev,
                    activeUsers: prev.activeUsers - 1,
                    blockedUsers: prev.blockedUsers + 1,
                }));
                setBlockModalUser(null);
                setBlockReason("");
            } else {
                toast.error(res.error || "Failed to block user.", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred.", { id: toastId });
        } finally {
            setLoadingId(null);
        }
    };

    const handleUnblock = async (user: any) => {
        setLoadingId(user._id);
        const toastId = toast.loading(`Restoring user access...`);

        try {
            const res = await unblockUserAdmin(user._id);
            if (res.success) {
                toast.success(res.message, { id: toastId });
                setUsers((prev) =>
                    prev.map((u) =>
                        u._id === user._id ? { ...u, isBlocked: false, blockedReason: undefined } : u
                    )
                );
                setStats((prev) => ({
                    ...prev,
                    activeUsers: prev.activeUsers + 1,
                    blockedUsers: prev.blockedUsers - 1,
                }));
            } else {
                toast.error(res.error || "Failed to restore user.", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred.", { id: toastId });
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteModalUser) return;

        setLoadingId(deleteModalUser._id);
        const toastId = toast.loading(`Deleting user and sending email notice...`);

        try {
            const res = await deleteUserAdmin(deleteModalUser._id, deleteReason);
            if (res.success) {
                toast.success(res.message, { id: toastId });
                setUsers((prev) => prev.filter((u) => u._id !== deleteModalUser._id));
                setStats((prev) => ({
                    ...prev,
                    totalUsers: prev.totalUsers - 1,
                    activeUsers: deleteModalUser.isBlocked ? prev.activeUsers : prev.activeUsers - 1,
                    blockedUsers: deleteModalUser.isBlocked ? prev.blockedUsers - 1 : prev.blockedUsers,
                }));
                setDeleteModalUser(null);
                setDeleteReason("");
            } else {
                toast.error(res.error || "Failed to delete user.", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred.", { id: toastId });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* STATS SUMMARY ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#e7ded0] rounded-2xl p-5 shadow-xs space-y-1">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Registered Users</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-serif font-bold text-[#212a3b]">{stats.totalUsers}</p>
                        <div className="p-2.5 bg-[#663820]/10 text-[#663820] rounded-xl">
                            <ShieldCheck size={22} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#e7ded0] rounded-2xl p-5 shadow-xs space-y-1">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Accounts</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-serif font-bold text-emerald-700">{stats.activeUsers}</p>
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                            <CheckCircle size={22} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#e7ded0] rounded-2xl p-5 shadow-xs space-y-1">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Blocked Accounts</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-serif font-bold text-rose-700">{stats.blockedUsers}</p>
                        <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
                            <Ban size={22} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#e7ded0] rounded-2xl p-5 shadow-xs space-y-1">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Library Books</p>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-serif font-bold text-amber-800">{stats.totalBooks}</p>
                        <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                            <ShieldAlert size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH & CONTROLS */}
            <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-100 pb-5">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[#212a3b]">User Management Control</h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Manage user accounts, block/unblock access, or remove users. Automatic emails are dispatched on status changes.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-[#663820]"
                        />
                    </div>
                </div>

                {/* USER TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-stone-200 bg-[#faf8f5] text-stone-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">User Details</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Joined Date</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-stone-500 font-medium">
                                        No users found matching query.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const isPrimaryAdmin = u.email.toLowerCase() === "darshtank05@gmail.com";
                                    const isAdminRole = u.role === "admin" || isPrimaryAdmin;

                                    return (
                                        <tr key={u._id} className="hover:bg-stone-50/80 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#663820] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#212a3b]">{u.name}</p>
                                                        <p className="text-[#663820] text-[11px] font-mono">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    isAdminRole
                                                        ? "bg-amber-100 border-amber-300 text-amber-900"
                                                        : "bg-stone-100 border-stone-200 text-stone-700"
                                                }`}>
                                                    {isAdminRole ? "Admin" : "User"}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {u.isBlocked ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <Ban size={10} /> Blocked
                                                        </span>
                                                        {u.blockedReason && (
                                                            <p className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[160px]" title={u.blockedReason}>
                                                                {u.blockedReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <CheckCircle size={10} /> Active
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                                                {new Date(u.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                {isPrimaryAdmin ? (
                                                    <span className="text-[10px] font-bold text-stone-400 italic">Protected Superadmin</span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {u.isBlocked ? (
                                                            <button
                                                                onClick={() => handleUnblock(u)}
                                                                disabled={loadingId === u._id}
                                                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <Unlock size={12} /> Unblock
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setBlockModalUser(u)}
                                                                disabled={loadingId === u._id}
                                                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <Ban size={12} /> Block
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => setDeleteModalUser(u)}
                                                            disabled={loadingId === u._id}
                                                            className="px-2 py-1 bg-stone-100 hover:bg-rose-600 hover:text-white text-stone-700 border border-stone-200 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BLOCK USER MODAL */}
            {blockModalUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-lg text-[#212a3b]">Suspend User Account</h3>
                                <p className="text-xs text-stone-500">User: {blockModalUser.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleBlockSubmit} className="space-y-4">
                            <p className="text-xs text-stone-600 leading-relaxed">
                                Are you sure you want to block <strong>{blockModalUser.name}</strong>? They will be immediately signed out and blocked from logging in. An email notice will automatically be sent to their address.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                    Reason for Suspension (Sent in Email)
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="e.g., Violation of terms of service / suspicious activity..."
                                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-[#663820]"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setBlockModalUser(null)}
                                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!blockReason.trim() || loadingId === blockModalUser._id}
                                    className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    Confirm & Block User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE USER MODAL */}
            {deleteModalUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-lg text-[#212a3b]">Permanently Delete User</h3>
                                <p className="text-xs text-stone-500">User: {deleteModalUser.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleDeleteSubmit} className="space-y-4">
                            <p className="text-xs text-stone-600 leading-relaxed">
                                Warning: Deleting <strong>{deleteModalUser.name}</strong> will permanently erase their account and all uploaded library books. An email notice will automatically be sent.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                    Deletion Reason (Optional Email Note)
                                </label>
                                <textarea
                                    rows={2}
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Optional reason included in email notice..."
                                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-[#663820]"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteModalUser(null)}
                                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingId === deleteModalUser._id}
                                    className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    Permanently Delete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
