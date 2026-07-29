import UploadForm from "@/components/UploadForm";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";

const Page = async () => {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/sign-in");
    }

    const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'darshtank05@gmail.com';
    if (isAdmin) {
        redirect("/admin");
    }

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
            <UploadForm />
        </main>
    );
};

export default Page;
