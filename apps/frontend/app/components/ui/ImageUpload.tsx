
'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string | File | null;
    onChange: (file: File) => void;
    onRemove?: () => void; // Allow clearing
    label?: string;
    className?: string;
}

export function ImageUpload({ value, onChange, onRemove, label, className = '' }: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(typeof value === 'string' ? value : null);
    const [isDragging, setIsDragging] = useState(false);

    // If value prop changes externally (e.g. initial load), update preview
    // Note: Dealing with File object preview requires URL.createObjectURL, handled in handleFile

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const url = URL.createObjectURL(file);
        setPreview(url);
        onChange(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

            {preview ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 group">
                    <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors"
                        >
                            <div className="flex items-center gap-2 px-2">
                                <Upload size={16} />
                                <span className="text-sm font-medium">เปลี่ยนรูป</span>
                            </div>
                        </button>
                        {onRemove && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPreview(null);
                                    onRemove();
                                }}
                                className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                aspect-video w-full rounded-xl border-2 border-dashed 
                flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            `}
                >
                    <div className={`p-3 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <ImageIcon size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">คลิกเพื่ออัปโหลด</p>
                        <p className="text-xs text-gray-500 mt-1">หรือลากไฟล์มาวางที่นี่ (16:9)</p>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />
        </div>
    );
}
