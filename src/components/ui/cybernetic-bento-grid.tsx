"use client";

import React, { useEffect, useRef, ReactNode } from 'react';
import Image from 'next/image';

// Reusable BentoItem component
interface BentoItemProps {
    className?: string;
    children: ReactNode;
}

const BentoItem = ({ className = "", children }: BentoItemProps) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.setProperty('--mouse-x', `${x}px`);
            item.style.setProperty('--mouse-y', `${y}px`);
        };

        item.addEventListener('mousemove', handleMouseMove);

        return () => {
            item.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div ref={itemRef} className={`bento-item ${className}`}>
            {children}
        </div>
    );
};

// Main Component
interface CyberneticBentoGridProps {
    items: Array<{
        title: string;
        description: string;
        icon?: ReactNode;
        image?: string;
        className?: string;
    }>;
    title?: string;
}

export const CyberneticBentoGrid = ({ items, title = "Core Features" }: CyberneticBentoGridProps) => {
    return (
        <div className="w-full z-10">
            {title && (
                <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8">
                    {title}
                </h1>
            )}
            <div className="bento-grid">
                {items.map((item, index) => (
                    <BentoItem key={index} className={item.className || ""}>
                        {item.icon && (
                            <div className="mb-4">
                                {item.icon}
                            </div>
                        )}
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                            {item.title}
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            {item.description}
                        </p>
                        {item.image && (
                            <div className="mt-4 h-48 bg-gray-100 rounded-lg overflow-hidden relative">
                                <Image 
                                    src={item.image} 
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </BentoItem>
                ))}
            </div>
        </div>
    );
};
