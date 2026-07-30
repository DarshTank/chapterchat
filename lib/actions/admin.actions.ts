'use server';

import { connectToDatabase } from "@/database/mongoose";
import User from "@/database/models/user.model";
import Admin from "@/database/models/admin.model";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import VoiceSession from "@/database/models/voice-session.model";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { sendAccountBlockedEmail, sendAccountUnblockedEmail, sendAccountDeletedEmail } from "@/lib/resend";
import { serializeData, escapeRegex } from "@/lib/utils";

/**
 * Ensures darshtank05@gmail.com exists in the Admin database collection
 */
export async function ensureAdminExists() {
    try {
        await connectToDatabase();
        const adminEmail = 'darshtank05@gmail.com';
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (!existingAdmin) {
            await Admin.create({
                email: adminEmail,
                name: 'Darsh Tank (Superadmin)',
                role: 'superadmin',
            });
            console.log(`Created superadmin entry for ${adminEmail} in Admin database collection.`);
        }
    } catch (err) {
        console.error("Error ensuring admin exists in Admin collection:", err);
    }
}

// Helper function to verify calling user is Admin
async function verifyAdminAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized: Please sign in");
    }

    await connectToDatabase();
    await ensureAdminExists();

    const adminEntry = await Admin.findOne({ email: user.email.toLowerCase() });
    const isAdmin = Boolean(adminEntry) || user.role === 'admin' || user.email.toLowerCase() === 'darshtank05@gmail.com';

    if (!isAdmin) {
        throw new Error("Forbidden: Admin privileges required");
    }

    return user;
}

/**
 * Automatically purge all books uploaded by admin darshtank05@gmail.com
 */
export async function purgeAdminUploadedBooks() {
    try {
        await connectToDatabase();
        const adminUser = await User.findOne({ email: 'darshtank05@gmail.com' });
        if (!adminUser) return;

        const adminIdStr = adminUser._id.toString();
        const adminBooks = await Book.find({
            $or: [
                { userId: adminIdStr },
                { userId: adminUser._id }
            ]
        }).select('_id');

        const bookIds = adminBooks.map(b => b._id);
        if (bookIds.length > 0) {
            await BookSegment.deleteMany({ bookId: { $in: bookIds } });
            await VoiceSession.deleteMany({ bookId: { $in: bookIds } });
            await Book.deleteMany({ _id: { $in: bookIds } });
            console.log(`Purged ${bookIds.length} books uploaded by admin ${adminUser.email}`);
        }
    } catch (err) {
        console.error("Error purging admin uploaded books:", err);
    }
}

/**
 * Fetch users list and platform stats for Admin Dashboard
 */
export async function getAdminUsersList(search?: string) {
    try {
        await verifyAdminAuth();
        await connectToDatabase();

        // Purge any books previously uploaded by admin
        await purgeAdminUploadedBooks();

        let query: any = {
            email: { $ne: 'darshtank05@gmail.com' }
        };

        if (search && search.trim()) {
            const escaped = escapeRegex(search.trim());
            const regex = new RegExp(escaped, 'i');
            query.$or = [
                { name: { $regex: regex } },
                { email: { $regex: regex } },
            ];
        }

        const users = await User.find(query).sort({ createdAt: -1 }).lean();

        // Calculate statistics (excluding superadmin)
        const totalUsers = await User.countDocuments({ email: { $ne: 'darshtank05@gmail.com' } });
        const activeUsers = await User.countDocuments({ email: { $ne: 'darshtank05@gmail.com' }, isBlocked: { $ne: true } });
        const blockedUsers = await User.countDocuments({ email: { $ne: 'darshtank05@gmail.com' }, isBlocked: true });
        const totalBooks = await Book.countDocuments({});

        return {
            success: true,
            data: {
                users: serializeData(users),
                stats: {
                    totalUsers,
                    activeUsers,
                    blockedUsers,
                    totalBooks,
                }
            }
        };
    } catch (err: any) {
        console.error("Error fetching admin users list:", err);
        return { success: false, error: err.message || "Failed to load admin data" };
    }
}

/**
 * Block a user and send an automated email notification
 */
export async function blockUserAdmin(targetUserId: string, reason?: string) {
    try {
        const admin = await verifyAdminAuth();
        await connectToDatabase();

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        // Prevent self-blocking
        if (targetUser._id.toString() === admin._id.toString() || targetUser.email.toLowerCase() === 'darshtank05@gmail.com') {
            return { success: false, error: "Primary Admin cannot be blocked" };
        }

        targetUser.isBlocked = true;
        targetUser.blockedReason = reason || "Suspended by administrator";
        await targetUser.save();

        // Send email notice to the user
        await sendAccountBlockedEmail(targetUser.email, targetUser.name, reason);

        return { success: true, message: `User ${targetUser.name} (${targetUser.email}) has been blocked.` };
    } catch (err: any) {
        console.error("Error blocking user:", err);
        return { success: false, error: err.message || "Failed to block user" };
    }
}

/**
 * Unblock a user and send an automated email notification
 */
export async function unblockUserAdmin(targetUserId: string) {
    try {
        await verifyAdminAuth();
        await connectToDatabase();

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        targetUser.isBlocked = false;
        targetUser.blockedReason = undefined;
        await targetUser.save();

        // Send email notice to the user
        await sendAccountUnblockedEmail(targetUser.email, targetUser.name);

        return { success: true, message: `User ${targetUser.name} (${targetUser.email}) access restored.` };
    } catch (err: any) {
        console.error("Error unblocking user:", err);
        return { success: false, error: err.message || "Failed to unblock user" };
    }
}

/**
 * Delete a user and all their associated data, sending an email notice
 */
export async function deleteUserAdmin(targetUserId: string, reason?: string) {
    try {
        const admin = await verifyAdminAuth();
        await connectToDatabase();

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        // Prevent self-deletion of primary admin
        if (targetUser._id.toString() === admin._id.toString() || targetUser.email.toLowerCase() === 'darshtank05@gmail.com') {
            return { success: false, error: "Primary Admin cannot be deleted" };
        }

        const userEmail = targetUser.email;
        const userName = targetUser.name;

        // Cascade delete user's books, segments, and voice sessions
        const userBooks = await Book.find({ userId: targetUserId }).select('_id');
        const bookIds = userBooks.map(b => b._id);

        if (bookIds.length > 0) {
            await BookSegment.deleteMany({ bookId: { $in: bookIds } });
            await VoiceSession.deleteMany({ bookId: { $in: bookIds } });
            await Book.deleteMany({ userId: targetUserId });
        }

        await User.findByIdAndDelete(targetUserId);

        // Send deletion notification email
        await sendAccountDeletedEmail(userEmail, userName, reason);

        return { success: true, message: `User ${userName} (${userEmail}) and library data deleted.` };
    } catch (err: any) {
        console.error("Error deleting user:", err);
        return { success: false, error: err.message || "Failed to delete user" };
    }
}

/**
 * Get public or admin system settings
 */
export async function getSystemSettings() {
    try {
        await connectToDatabase();
        const SystemSettings = (await import("@/database/models/system-settings.model")).default;
        let settings = await SystemSettings.findOne({ key: 'global' }).lean();

        if (!settings) {
            settings = await SystemSettings.create({ key: 'global', disableInspect: true });
            settings = serializeData(settings);
        }

        return { success: true, data: serializeData(settings) };
    } catch (err: any) {
        console.error("Error fetching system settings:", err);
        return { success: false, error: err.message, data: { key: 'global', disableInspect: true } };
    }
}

/**
 * Toggle inspect element & right-click restriction
 */
export async function toggleDisableInspectAction(enabled: boolean) {
    try {
        await verifyAdminAuth();
        await connectToDatabase();

        const SystemSettings = (await import("@/database/models/system-settings.model")).default;
        const settings = await SystemSettings.findOneAndUpdate(
            { key: 'global' },
            { disableInspect: enabled },
            { upsert: true, new: true }
        ).lean();

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/');
        revalidatePath('/admin');

        return {
            success: true,
            disableInspect: settings.disableInspect,
            message: `Inspect element \& right-click protection ${enabled ? 'ENABLED' : 'DISABLED'} across the application.`
        };
    } catch (err: any) {
        console.error("Error toggling inspect settings:", err);
        return { success: false, error: err.message || "Failed to update settings" };
    }
}

