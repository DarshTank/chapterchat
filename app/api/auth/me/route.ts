import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.actions";

export async function GET() {
    try {
        const user = await getCurrentUser();
        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ user: null });
    }
}
