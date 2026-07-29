import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/books/new", "/profile"];

export default function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get("chapterchat_session")?.value;
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtected && !sessionToken) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
