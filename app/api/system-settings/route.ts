import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import SystemSettings from '@/database/models/system-settings.model';

export async function GET() {
    try {
        await connectToDatabase();
        let settings = await SystemSettings.findOne({ key: 'global' }).lean();
        if (!settings) {
            settings = await SystemSettings.create({ key: 'global', disableInspect: true });
        }
        return NextResponse.json({ disableInspect: Boolean(settings.disableInspect) }, {
            headers: { 'Cache-Control': 'no-store' }
        });
    } catch (error) {
        return NextResponse.json({ disableInspect: true }, { status: 200 });
    }
}
