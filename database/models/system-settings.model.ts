import { model, Schema, models } from "mongoose";

export interface ISystemSettings {
    _id?: string;
    key: string;
    disableInspect: boolean;
    updatedAt?: Date;
    createdAt?: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    key: { type: String, required: true, unique: true, default: 'global' },
    disableInspect: { type: Boolean, default: true },
}, { timestamps: true });

const SystemSettings = models.SystemSettings || model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
