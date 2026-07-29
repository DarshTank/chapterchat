'use client';

import React, { useCallback, useRef } from 'react';
import { useController, FieldValues } from 'react-hook-form';
import { X } from 'lucide-react';
import { FileUploadFieldProps } from '@/types';
import { cn } from '@/lib/utils';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const FileUploader = <T extends FieldValues>({
    control,
    name,
    label,
    acceptTypes,
    disabled,
    icon: Icon,
    placeholder,
    hint,
}: FileUploadFieldProps<T>) => {
    const {
        field: { onChange, value },
    } = useController({ name, control });

    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                onChange(file);
            }
        },
        [onChange]
    );

    const onRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onChange(null);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [onChange]
    );

    const isUploaded = !!value;

    return (
        <FormItem className="w-full">
            <FormLabel className="font-serif text-lg font-bold text-[#212a3b] mb-2 block">{label}</FormLabel>
            <FormControl>
                <div
                    className={cn(
                        'group relative flex flex-col items-center justify-center min-h-[160px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-6 text-center',
                        isUploaded
                            ? 'bg-[#f4efe6] border-[#663820]/40 shadow-sm'
                            : 'bg-[#fcfaf6] hover:bg-[#f6f0e3] border-[#e2d7c5] hover:border-[#663820]/60',
                        disabled && 'opacity-60 cursor-not-allowed'
                    )}
                    onClick={() => !disabled && inputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept={acceptTypes.join(',')}
                        className="hidden"
                        ref={inputRef}
                        onChange={handleFileChange}
                        disabled={disabled}
                    />

                    {isUploaded ? (
                        <div className="flex items-center justify-between w-full bg-white/80 backdrop-blur-sm border border-[#e2d7c5] rounded-xl p-4 shadow-xs">
                            <div className="flex items-center gap-3.5 overflow-hidden text-left">
                                <div className="w-10 h-10 rounded-xl bg-[#663820]/10 border border-[#663820]/20 flex items-center justify-center text-[#663820] shrink-0 font-bold">
                                    <Icon className="w-5 h-5 text-[#663820]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-[#212a3b] text-base truncate">{(value as File).name}</p>
                                    <p className="text-xs text-stone-500 font-medium">
                                        {((value as File).size / (1024 * 1024)).toFixed(2)} MB • Ready for synthesis
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onRemove}
                                title="Remove file"
                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-[#663820]/10 border border-[#663820]/20 flex items-center justify-center text-[#663820] mb-1 group-hover:scale-105 transition-transform">
                                <Icon className="w-6 h-6 text-[#663820]" />
                            </div>
                            <p className="font-bold text-[#212a3b] text-base group-hover:text-[#663820] transition-colors">{placeholder}</p>
                            <p className="text-xs text-stone-500 font-medium">{hint}</p>
                        </div>
                    )}
                </div>
            </FormControl>
            <FormMessage className="text-sm font-medium text-red-600 mt-1.5" />
        </FormItem>
    );
};

export default FileUploader;
