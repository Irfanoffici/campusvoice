import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    label: string; // Placeholder or label
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    icon?: React.ElementType;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
    label,
    value,
    options,
    onChange,
    icon: Icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || label;

    return (
        <div ref={containerRef} style={{ position: 'relative', zIndex: 50 }}>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    minWidth: '200px',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    backdropFilter: 'blur(5px)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icon && <Icon size={16} color="rgba(255,255,255,0.6)" />}
                    <span style={{ color: value !== 'all' ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                        {selectedLabel}
                    </span>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            width: '100%',
                            minWidth: '220px',
                            background: 'rgba(15, 15, 15, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '6px',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(20px)',
                            overflow: 'hidden'
                        }}
                    >
                        {options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <motion.button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        textAlign: 'left'
                                    }}
                                >
                                    {option.label}
                                    {isSelected && <Check size={14} color="#fff" />}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
