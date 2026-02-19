"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { uploadApi } from '@/app/lib/api';
import { toast } from 'sonner';

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
    maxWidth?: number; // for compression
    aspectRatio?: string; // e.g. "aspect-[3/1]" for CSS
}

export default function ImageUpload({
    value,
    onChange,
    label = "Upload Image",
    className = "",
    maxWidth = 1920,
    aspectRatio = "aspect-video"
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        if (!file) return;

        // 1. Validate File
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPG, PNG, WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB Limit Check
            toast.error('File size is too large (Max 5MB)');
            return;
        }

        setIsUploading(true);
        try {
            // 2. Client-Side Compression
            const options = {
                maxSizeMB: 1, // Target 1MB
                maxWidthOrHeight: maxWidth,
                useWebWorker: true,
                fileType: 'image/webp',
                initialQuality: 0.8
            };

            const compressedFile = await imageCompression(file, options);

            // 3. Upload to Backend
            const res = await uploadApi.uploadImage(compressedFile);

            if (res.success && res.url) {
                setPreview(res.url);
                onChange(res.url);
                toast.success('Image uploaded successfully');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPreview(null);
        onChange('');
    };

    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}

            <div
                className={`
                    relative w-full ${aspectRatio} rounded-xl overflow-hidden transition-all duration-300
                    flex flex-col items-center justify-center cursor-pointer group
                    ${isDragging
                        ? 'bg-blue-50 border-2 border-dashed border-primary scale-[1.02] shadow-lg'
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                    ${!preview && !isDragging && 'border-dashed'}
                `}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center text-primary animate-pulse">
                        <Loader2 className="w-10 h-10 animate-spin mb-3" />
                        <span className="text-sm font-semibold">Optimizing & Uploading...</span>
                    </div>
                ) : preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            <ImageIcon className="w-8 h-8 text-white/80" />
                            <p className="text-white font-medium text-sm">Click to Replace</p>
                        </div>

                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-500 hover:text-red-500 hover:bg-white transition-all z-10"
                            title="Remove Image"
                        >
                            <X size={18} />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-gray-400 p-6 text-center transition-transform duration-300 group-hover:scale-105">
                        <div className={`p-4 rounded-full mb-3 ${isDragging ? 'bg-blue-100 text-primary' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'}`}>
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                            {isDragging ? 'Drop image here' : 'Click to upload'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            or drag and drop<br />
                            <span className="opacity-70">JPG, PNG, WebP (Max 5MB)</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
