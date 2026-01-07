import React from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, type Category } from '../types';

interface Props {
    selected: Category | null;
    onSelect: (category: Category) => void;
}

export const CategoryChips: React.FC<Props> = ({ selected, onSelect }) => {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map((cat) => {
                const isSelected = selected === cat.id;
                return (
                    <motion.button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            borderColor: isSelected ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.5)'
                        }}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '9999px',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {cat.label}
                    </motion.button>
                );
            })}
        </div>
    );
};
