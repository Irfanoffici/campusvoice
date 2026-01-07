import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Props {
    onReset: () => void;
}

export const SuccessView: React.FC<Props> = ({ onReset }) => {
    return (
        <motion.div
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '30px',
                padding: '20px 0'
            }}
        >
            <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                style={{
                    color: '#000',
                    background: '#fff',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Check size={32} strokeWidth={3} />
            </motion.div>

            <div>
                <h2 style={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: '10px',
                    color: '#fff',
                    lineHeight: 1
                }}>
                    Received
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
                    Your voice has been heard anonymously.
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReset}
                style={{
                    marginTop: '20px',
                    background: 'transparent',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.3s'
                }}
            >
                Submit Another
            </motion.button>
        </motion.div>
    );
};
