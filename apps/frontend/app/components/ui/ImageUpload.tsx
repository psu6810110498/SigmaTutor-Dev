
'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string | File | null;
    onChange: (file: File) => void;
    onRemove?: () => void;
    label?: string;
    className?: string;
    maxWidth?: number;   // default 1280
    maxHeight?: number;  // default 720
    quality?: number;    // default 0.85
}

// ── Client-side image compression via Canvas API ──────────────
async function compressImage(
    file: File,
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.85,
): Promise<File> {
    return new Promise((resolve) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;

            // Scale down while keeping aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    const compressed = new File(
                        [blob],
                        file.name.replace(/\.[^.]+$/, '.jpg'),
                        { type: 'image/jpeg' },
                    );
                    resolve(compressed);
                },
                'image/jpeg',
                quality,
            );
        };
        img.onerror = () => resolve(file); // fallback: use original
        img.src = url;
    });
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    label,
    className = '',
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.85,
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(
        typeof value === 'string' ? value : null,
    );
    const [isDragging, setIsDragging] = useState(false);
    const [compressInfo, setCompressInfo] = useState<{ before: number; after: number } | null>(null);
    const [compressing, setCompressing] = useState(false);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setCompressing(true);
        const originalSize = file.size;
        const compressed = await compressImage(file, maxWidth, maxHeight, quality);
        setCompressing(false);
        setCompressInfo({ before: originalSize, after: compressed.size });
        const url = URL.createObjectURL(compressed);
        setPreview(url);
        onChange(compressed);
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
                <>
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 group">
                        {compressing && (
                            <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center text-white text-sm gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                กำลังบีบอัด…
                            </div>
                        )}
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
                                        setCompressInfo(null);
                                        onRemove();
                                    }}
                                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Compress info badge */}
                    {compressInfo && (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span>
                                บีบอัดแล้ว: {formatBytes(compressInfo.before)} → <strong>{formatBytes(compressInfo.after)}</strong>
                                {' '}(-{Math.round((1 - compressInfo.after / compressInfo.before) * 100)}%)
                            </span>
                        </div>
                    )}
                </>
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
                        <p className="text-xs text-gray-400 mt-0.5">ระบบจะบีบอัดอัตโนมัติ → max 1280×720 JPEG</p>
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

