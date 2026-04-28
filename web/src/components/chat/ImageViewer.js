import { useEffect } from 'react';

export const ImageViewer = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out"
      onClick={onClose}
    >
      <img 
        src={imageUrl} 
        alt="Full screen" 
        className="max-w-[90vw] max-h-[90vh] object-contain"
        style={{ transform: 'scale(1)', transition: 'transform 0.3s' }}
      />
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
      >
        ×
      </button>
    </div>
  );
};