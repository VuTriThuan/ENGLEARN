import React from 'react';

export default function ModalWrapper({ 
  isOpen, 
  zIndex = 'z-[100]', 
  className = 'rounded-[1.5rem] w-full max-w-md p-6', 
  children 
}) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-cyan-950/70 ${zIndex} flex items-center justify-center p-4 backdrop-blur-sm transition-opacity`}>
      <div className={`bg-white shadow-2xl animate-in zoom-in duration-200 ${className}`}>
        {children}
      </div>
    </div>
  );
}