import { useEffect } from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const boxStyle = {
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  maxWidth: 420,
  width: '90%',
  padding: 24,
};

const titleStyle = (variant) => ({
  margin: '0 0 12px 0',
  fontSize: 18,
  color: variant === 'error' ? '#c62828' : variant === 'warning' ? '#e65100' : '#1565c0',
});

const messageStyle = {
  margin: '0 0 20px 0',
  color: '#333',
  lineHeight: 1.5,
};

const buttonStyle = {
  display: 'block',
  marginLeft: 'auto',
  padding: '8px 20px',
  background: '#1976d2',
  color: '#fff',
  border: 0,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
};

export default function AlertModal({ open, onClose, title, message, variant = 'error' }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const defaultTitle = variant === 'error' ? 'Error' : variant === 'warning' ? 'Aviso' : 'Información';

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="alert-modal-title">
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <h2 id="alert-modal-title" style={titleStyle(variant)}>{title || defaultTitle}</h2>
        <p style={messageStyle}>{message}</p>
        <button type="button" onClick={onClose} style={buttonStyle}>Cerrar</button>
      </div>
    </div>
  );
}
