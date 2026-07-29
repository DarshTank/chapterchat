import { getCurrentUser } from "@/lib/actions/auth.actions";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions";
import ClientVoiceControls from "@/components/ClientVoiceControls";
import DeleteBookButton from "@/components/DeleteBookButton";

export const dynamic = 'force-dynamic';

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const book = result.data;

  return (
    <div className="wrapper pt-1 pb-16 space-y-4">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-[#663820] font-semibold text-sm transition-colors py-1 px-3 rounded-lg hover:bg-stone-200/50"
        >
          <ArrowLeft size={18} />
          <span>Back to Personal Library</span>
        </Link>

        <DeleteBookButton
          bookId={book._id}
          bookTitle={book.title}
          variant="page"
          redirectOnDelete={true}
        />
      </div>

      <ClientVoiceControls book={book} />
    </div>
  );
}
