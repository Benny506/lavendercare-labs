import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { removeAlert } from '../../store/slices/uiSlice';
import { 
  IoCheckmarkCircleOutline, 
  IoWarningOutline, 
  IoInformationCircleOutline, 
  IoCloseCircleOutline 
} from 'react-icons/io5';
import { IoMdClose } from "react-icons/io";
import './GlobalAlerts.css';

const ALERT_ICONS = {
  success: <IoCheckmarkCircleOutline />,
  error: <IoCloseCircleOutline />,
  danger: <IoCloseCircleOutline />,
  warning: <IoWarningOutline />,
  info: <IoInformationCircleOutline />,
  primary: <IoInformationCircleOutline />
};

// Extracted Alert Item component to handle its own auto-dismiss timeout
const AlertItem = ({ alert, onRemove }) => {
  useEffect(() => {
    const duration = alert.duration || 3000;
    const timer = setTimeout(() => {
      onRemove(alert.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [alert.id, alert.duration, onRemove]);

  return (
    <Motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 1 }}
      className={`lc-alert lc-alert--${alert.type || 'info'}`}
      role="alert"
    >
      <div className="lc-alert__icon">
        {ALERT_ICONS[alert.type] || ALERT_ICONS.info}
      </div>
      <div className="lc-alert__content">{alert.message}</div>
      <button
        type="button"
        className="lc-alert__close"
        onClick={() => onRemove(alert.id)}
        aria-label="Close alert"
      >
        <IoMdClose size={20} />
      </button>
    </Motion.div>
  );
};

const GlobalAlerts = () => {
  const alerts = useSelector((state) => state.ui.alerts);
  const dispatch = useDispatch();

  const handleRemove = useCallback((id) => {
    dispatch(removeAlert(id));
  }, [dispatch]);

  return (
    <div className="lc-alerts-portal">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} onRemove={handleRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalAlerts;
