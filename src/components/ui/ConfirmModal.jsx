import React from 'react';
import Modal from './Modal';
import '../../styles/components/ConfirmModal.css';

function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger', 'warning', 'primary'
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {cancelText}
      </button>
      <button className={`btn btn-${variant}`} onClick={handleConfirm}>
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="small">
      <div className="confirm-modal-content">
        <div className={`confirm-icon ${variant}`}>
          {variant === 'danger' && '⚠️'}
          {variant === 'warning' && '⚡'}
          {variant === 'primary' && '❓'}
        </div>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
