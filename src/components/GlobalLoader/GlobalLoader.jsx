import React from 'react';
import { useSelector } from 'react-redux';
import { motion as Motion, AnimatePresence } from 'motion/react';
import './GlobalLoader.css';

const GlobalLoader = () => {
  const { isLoading, message } = useSelector((state) => state.ui.globalLoader);

  return (
    <AnimatePresence>
      {isLoading && (
        <Motion.div
          className="lc-global-loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Motion.div
            className="lc-global-loader-content"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
          >
            <div className="lc-global-loader-spinner-container">
              <div className="lc-spinner-ring"></div>
              <div className="lc-spinner-ring-inner"></div>
              <img 
                src="/assets/logo.svg" 
                alt="LavenderCare Logo" 
                className="lc-loader-logo" 
              />
            </div>
            <h3 className="lc-loader-title">LavenderCare Labs</h3>
            <p className="lc-loader-message">{message}</p>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
