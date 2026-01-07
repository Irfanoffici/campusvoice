import React from 'react';
import { motion } from 'framer-motion';
import { PRIORITIES, type Priority } from '../types';

interface Props {
    selected: Priority;
    onSelect: (priority: Priority) => void;
}

export const PriorityControl: React.FC<Props> = ({ selected, onSelect }) => {
    return (
        <div style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '16px',
            display: 'flex',
            gap: '24px',
            alignItems: 'center'
        }}>
            {PRIORITIES.map((p) => {
                const isSelected = selected === p.id;
                return (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelect(p.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                            transition: 'color 0.3s ease',
                            position: 'relative',
                            padding: '8px 0'
                        }}
                    >
                        {p.label}
                        {isSelected && (
                            <motion.div
                                layoutId="priority-indicator"
                                style={{
                                    position: 'absolute',
                                    bottom: '-17px', // Align with parent border
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'white',
                                    borderRadius: '2px',
                                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                                }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
