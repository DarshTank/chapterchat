'use client';

import Link from "next/link";
import { BookCardProps } from "@/types";
import Image from "next/image";
import { formatBlobUrl } from "@/lib/utils";
import DeleteBookButton from "./DeleteBookButton";

const BookCard = ({ id, title, author, coverURL, slug }: BookCardProps) => {
    return (
        <div className="relative group">
            <Link href={`/books/${slug}`} className="block">
                <article className="book-card">
                    <figure className="book-card-figure">
                        <div className="book-card-cover-wrapper relative">
                            <Image src={formatBlobUrl(coverURL)} alt={title} width={133} height={200} className="book-card-cover" />
                        </div>

                        <figcaption className="book-card-meta">
                            <h3 className="book-card-title">{title}</h3>
                            <p className="book-card-author">{author}</p>
                        </figcaption>
                    </figure>
                </article>
            </Link>

            {id && (
                <DeleteBookButton
                    bookId={id}
                    bookTitle={title}
                    variant="card"
                />
            )}
        </div>
    );
};

export default BookCard;

