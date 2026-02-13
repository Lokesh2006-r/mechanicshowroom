'use client';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, title, children }: any) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(() => setShow(false), 300);
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!isOpen && !show) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* macOS-style backdrop */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(8px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
                }}
                onClick={onClose}
            ></div>

            {/* macOS Window */}
            <div
                className={`relative w-[95%] md:w-full max-w-lg transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                style={{
                    background: 'rgba(30, 30, 56, 0.95)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    boxShadow: '0 22px 70px 4px rgba(0,0,0,0.56), 0 0 0 1px rgba(255,255,255,0.03) inset',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* macOS Titlebar */}
                <div className="flex items-center justify-between px-4 py-3.5 relative shrink-0" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {/* Traffic light dots */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full hover:brightness-110 transition-all flex items-center justify-center group"
                            style={{ background: '#FF5F57', boxShadow: '0 0 4px rgba(255,95,87,0.4)' }}
                        >
                            <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold leading-none">✕</span>
                        </button>
                        <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 4px rgba(255,189,46,0.4)' }}></span>
                        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840', boxShadow: '0 0 4px rgba(40,200,64,0.4)' }}></span>
                    </div>

                    {/* Centered title */}
                    <h3 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-medium text-[#86868B] truncate max-w-[50%]">
                        {title}
                    </h3>

                    {/* Right Close Button */}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
