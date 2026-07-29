'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, ImageIcon } from 'lucide-react';
import { UploadSchema } from '@/lib/zod';
import { BookUploadFormValues } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ACCEPTED_PDF_TYPES, ACCEPTED_IMAGE_TYPES, DEFAULT_VOICE } from '@/lib/constants';
import dynamic from 'next/dynamic';
import FileUploader from './FileUploader';
import LoadingOverlay from './LoadingOverlay';

const VoiceSelector = dynamic(() => import('./VoiceSelector'), {
    ssr: false,
});
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
import {checkBookExists, createBook, saveBookSegments} from "@/lib/actions/book.actions";
import {useRouter} from "next/navigation";
import {parsePDFFile} from "@/lib/utils";

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { userId } = useAuth();
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            persona: '',
            pdfFile: undefined,
            coverImage: undefined,
        },
    });

    const onSubmit = async (data: BookUploadFormValues) => {
        if(!userId) {
           return toast.error("Please login to upload books");
        }

        setIsSubmitting(true);

        // PostHog -> Track Book Uploads...

        try {
            const existsCheck = await checkBookExists(data.title);

            if(existsCheck.exists && existsCheck.book) {
                toast.info("Book with same title already exists.");
                form.reset()
                router.push(`/books/${existsCheck.book.slug}`)
                return;
            }

            const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase();
            const pdfFile = data.pdfFile;

            const parsedPDF = await parsePDFFile(pdfFile);

            if(parsedPDF.content.length === 0) {
                toast.error("Failed to parse PDF. Please try again with a different file.");
                return;
            }

            const uploadFileServer = async (filename: string, file: File | Blob) => {
                const formData = new FormData();
                formData.append('file', file, filename);
                formData.append('filename', filename);

                const res = await fetch('/api/upload/file', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Upload failed');
                }

                return await res.json();
            };

            const uploadedPdfBlob = await uploadFileServer(`${fileTitle}.pdf`, pdfFile);

            let coverUrl: string;

            if (data.coverImage) {
                const coverFile = data.coverImage;
                const uploadedCoverBlob = await uploadFileServer(`${fileTitle}_cover.png`, coverFile);
                coverUrl = uploadedCoverBlob.url;
            } else {
                const response = await fetch(parsedPDF.cover);
                const blob = await response.blob();

                const uploadedCoverBlob = await uploadFileServer(`${fileTitle}_cover.png`, blob);
                coverUrl = uploadedCoverBlob.url;
            }

            const book = await createBook({
                userId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadedPdfBlob.url,
                fileBlobKey: uploadedPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size,
            });

            if(!book.success) {
                toast.error(book.error as string || "Failed to create book");
                return;
            }

            if(book.alreadyExists) {
                toast.info("Book with same title already exists.");
                form.reset()
                router.push(`/books/${book.data.slug}`)
                return;
            }

            const segments = await saveBookSegments(book.data._id, userId, parsedPDF.content);

            if(!segments.success) {
                toast.error("Failed to save book segments");
                throw new Error("Failed to save book segments");
            }

            form.reset();
            router.push('/');
        } catch (error) {
            console.error(error);

            toast.error("Failed to upload book. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <>
            {isSubmitting && <LoadingOverlay />}

            <div className="bg-white border border-[#e2d7c5] rounded-3xl p-6 sm:p-10 shadow-xl max-w-4xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                        {/* SECTION 1: MANUSCRIPT & COVER FILES */}
                        <div className="space-y-6">
                            <div className="border-b border-stone-200 pb-3 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-[#663820]/10 text-[#663820] font-serif font-bold text-sm flex items-center justify-center">1</span>
                                <h3 className="font-serif font-bold text-xl text-[#212a3b]">Book Manuscripts & Assets</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 1. PDF File Upload */}
                                <FileUploader
                                    control={form.control}
                                    name="pdfFile"
                                    label="Book PDF Manuscript *"
                                    acceptTypes={ACCEPTED_PDF_TYPES}
                                    icon={Upload}
                                    placeholder="Click to upload PDF"
                                    hint="Supports standard PDF files up to 50MB"
                                    disabled={isSubmitting}
                                />

                                {/* 2. Cover Image Upload */}
                                <FileUploader
                                    control={form.control}
                                    name="coverImage"
                                    label="Cover Image (Optional)"
                                    acceptTypes={ACCEPTED_IMAGE_TYPES}
                                    icon={ImageIcon}
                                    placeholder="Click to upload cover"
                                    hint="Leave empty to auto-extract cover from PDF"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* SECTION 2: BOOK DETAILS */}
                        <div className="space-y-6">
                            <div className="border-b border-stone-200 pb-3 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-[#663820]/10 text-[#663820] font-serif font-bold text-sm flex items-center justify-center">2</span>
                                <h3 className="font-serif font-bold text-xl text-[#212a3b]">Book Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 3. Title Input */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-serif text-lg font-bold text-[#212a3b] mb-2 block">Book Title *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full h-13 px-4 bg-[#fcfaf6] border border-[#e2d7c5] focus:border-[#663820] focus:ring-2 focus:ring-[#663820]/20 rounded-xl text-base font-medium text-[#212a3b] placeholder:text-stone-400 transition-all outline-none"
                                                    placeholder="ex: Rich Dad Poor Dad"
                                                    {...field}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-sm font-medium text-red-600 mt-1" />
                                        </FormItem>
                                    )}
                                />

                                {/* 4. Author Input */}
                                <FormField
                                    control={form.control}
                                    name="author"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-serif text-lg font-bold text-[#212a3b] mb-2 block">Author Name *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full h-13 px-4 bg-[#fcfaf6] border border-[#e2d7c5] focus:border-[#663820] focus:ring-2 focus:ring-[#663820]/20 rounded-xl text-base font-medium text-[#212a3b] placeholder:text-stone-400 transition-all outline-none"
                                                    placeholder="ex: Robert Kiyosaki"
                                                    {...field}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-sm font-medium text-red-600 mt-1" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 3: VOICE PERSONA */}
                        <div className="space-y-6">
                            <div className="border-b border-stone-200 pb-3 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-[#663820]/10 text-[#663820] font-serif font-bold text-sm flex items-center justify-center">3</span>
                                <h3 className="font-serif font-bold text-xl text-[#212a3b]">AI Voice Persona</h3>
                            </div>

                            {/* 5. Voice Selector */}
                            <FormField
                                control={form.control}
                                name="persona"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-serif text-lg font-bold text-[#212a3b] mb-2 block">Choose Assistant Voice *</FormLabel>
                                        <FormControl>
                                            <VoiceSelector
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-sm font-medium text-red-600 mt-1" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* SECTION 4: SUBMIT ACTION */}
                        <div className="pt-4 border-t border-stone-200">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 h-14 bg-[#663820] hover:bg-[#7a4528] text-white font-serif font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Begin Synthesis
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
};

export default UploadForm;
