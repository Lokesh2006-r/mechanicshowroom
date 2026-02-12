'use client';

import { useState, useRef, useEffect } from 'react';

export interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
    name?: string; // For form submission
}

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "", icon, name }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {name && <input type="hidden" name={name} value={value} />}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm group"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-slate-400 group-hover:text-blue-400 transition-colors">{icon}</span>}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full min-w-[160px] mt-2 rounded-xl overflow-hidden animate-slide-up shadow-2xl ring-1 ring-white/10 origin-top"
                    style={{
                        background: 'rgba(26, 26, 46, 0.85)', // Semi-transparent dark
                        backdropFilter: 'blur(24px) saturate(1.8)', // The blur effect
                        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between mb-0.5 last:mb-0
                                    ${value === option.value
                                        ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                            >
                                <span className="truncate">{option.label}</span>
                                {value === option.value && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
