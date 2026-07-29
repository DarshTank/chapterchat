'use client';

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteBook } from '@/lib/actions/book.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteBookButtonProps {
    bookId: string;
    bookTitle: string;
    variant?: 'card' | 'page';
    redirectOnDelete?: boolean;
}

const DeleteBookButton: React.FC<DeleteBookButtonProps> = ({
    bookId,
    bookTitle,
    variant = 'card',
    redirectOnDelete = false,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDeleting) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${bookTitle}"? This will permanently remove the book and all its AI context.`
        );

        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const res = await deleteBook(bookId);
            if (res.success) {
                toast.success(`"${bookTitle}" deleted successfully.`);
                if (redirectOnDelete) {
                    router.push('/');
                } else {
                    router.refresh();
                }
            } else {
                toast.error(res.error || 'Failed to delete book.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('An error occurred while deleting the book.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (variant === 'page') {
        return (
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Delete book"
            >
                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Book'}</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 z-20 p-2 bg-stone-900/70 hover:bg-red-600 text-white rounded-full transition-all shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 cursor-pointer disabled:opacity-50"
            title={`Delete "${bookTitle}"`}
        >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
};

export default DeleteBookButton;
