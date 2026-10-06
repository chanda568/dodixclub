// src/components/common/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, scale: 0.99 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.01 }
};

const pageTransitionConfig = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.2
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransitionConfig}
      className="w-full min-h-screen bg-[#090d16]"
    >
      {children}
    </motion.div>
  );
}