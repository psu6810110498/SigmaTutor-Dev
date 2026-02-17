
'use client';

import { useState, useEffect } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: number;
    onChange?: (value: number) => void;
    label?: string;
    error?: string;
}

export function NumberInput({ value, onChange, label, error, className = '', ...props }: NumberInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value !== undefined && value !== null) {
            setDisplayValue(value.toLocaleString('en-US'));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');

        // Allow empty string to clear
        if (rawValue === '') {
            setDisplayValue('');
            onChange?.(0);
            return;
        }

        // Only allow numbers
        if (!/^\d*$/.test(rawValue)) return;

        const numValue = parseInt(rawValue, 10);
        setDisplayValue(Number(rawValue).toLocaleString('en-US')); // Format while typing? Maybe jarring. 
        // Standard banking apps often format as you type or on blur.
        // Let's format raw first, then format on blur? or format as typing if it doesn't break cursor?
        // Cursor jumping is an issue with auto-formatting on change. 
        // Let's simplified: Keep raw while typing, format on blur.
        // But user asked for "Auto-Comma: Type 1000 show 1,000".

        // Better approach for controlled input:
        // Update local display value immediately with commas
        // But we need to handle cursor position if we do that, which is complex.
        // Simple version: Allow raw typing, format on blur OR format simple append.

        // Re-reading user request: "Auto-Comma: Type 1000 show 1,000 automatically".
        // I will implement simple formatting.
        const formatted = Number(rawValue).toLocaleString('en-US');
        setDisplayValue(formatted);
        onChange?.(numValue);
    };

    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent ${error ? 'border-red-500 focus-visible:ring-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
