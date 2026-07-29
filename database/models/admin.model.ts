import { model, Schema, models } from "mongoose";
import { IAdmin } from "@/types";

const AdminSchema = new Schema<IAdmin>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'superadmin' },
}, { timestamps: true });

const Admin = models.Admin || model<IAdmin>('Admin', AdminSchema);

export default Admin;
