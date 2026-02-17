
'use client';

import { useState, useRef } from 'react';
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface RichTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    error?: string;
}

export function RichTextarea({ value, onChange, label, error, className = '', ...props }: RichTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value; // Use local state here
        const selected = text.substring(start, end);

        const before = text.substring(0, start);
        const after = text.substring(end);

        const newText = `${before}${prefix}${selected}${suffix}${after}`;
        onChange(newText);

        // Focus back
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

            <div className={`group overflow-hidden rounded-lg border bg-white focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}>
                {/* Toolbar */}
                <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
                    <ToolbarButton icon={Bold} onClick={() => insertFormat('**', '**')} tooltip="Bold" />
                    <ToolbarButton icon={Italic} onClick={() => insertFormat('*', '*')} tooltip="Italic" />
                    <div className="mx-1 h-4 w-px bg-gray-300" />
                    <ToolbarButton icon={List} onClick={() => insertFormat('- ')} tooltip="List" />
                    <ToolbarButton icon={LinkIcon} onClick={() => insertFormat('[', '](url)')} tooltip="Link" />
                    <ToolbarButton icon={ImageIcon} onClick={() => insertFormat('![alt](', ')')} tooltip="Image" />
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full resize-y bg-transparent p-3 text-sm placeholder:text-gray-400 focus:outline-none min-h-[120px]"
                    {...props}
                />
            </div>

            {error && <span className="text-xs text-red-500">{error}</span>}
            <p className="text-xs text-gray-400 text-right">Markdown supported</p>
        </div>
    );
}

function ToolbarButton({ icon: Icon, onClick, tooltip }: { icon: any, onClick: () => void, tooltip: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tooltip}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
        >
            <Icon size={16} />
        </button>
    );
}
