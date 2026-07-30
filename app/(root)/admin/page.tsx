import { getCurrentUser } from "@/lib/actions/auth.actions";
import { getAdminUsersList, getSystemSettings } from "@/lib/actions/admin.actions";
import { redirect } from "next/navigation";
import AdminUserTable from "@/components/AdminUserTable";

export default async function AdminDashboardPage() {
    const user = await getCurrentUser();

    // Enforce admin security check
    const userEmail = user?.email?.toLowerCase() || '';
    const isAdmin = user && (user.role === 'admin' || userEmail.includes('darshtank'));
    if (!isAdmin) {
        redirect("/");
    }

    const res = await getAdminUsersList();
    const settingsRes = await getSystemSettings();
    const initialDisableInspect = settingsRes.data?.disableInspect ?? true;

    if (!res.success || !res.data) {
        return (
            <div className="wrapper py-12 text-center text-rose-700">
                <p>Failed to load admin management system. {res.error}</p>
            </div>
        );
    }

    return (
        <div className="wrapper pt-2 pb-16 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7ded0] pb-5">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#212a3b]">Admin Console</h1>
                    <p className="text-xs text-stone-600 font-medium">
                        Logged in as <strong className="text-[#663820]">{user.email}</strong> (System Superadmin)
                    </p>
                </div>
            </div>

            <AdminUserTable
                initialUsers={res.data.users}
                initialStats={res.data.stats}
                initialDisableInspect={initialDisableInspect}
            />
        </div>
    );
}
