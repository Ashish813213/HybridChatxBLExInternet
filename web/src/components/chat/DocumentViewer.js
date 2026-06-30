import { useEffect } from 'react';

export const DocumentViewer = ({ documentUrl, documentName, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getFileExtension = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    return ext || '';
  };

  const getDownloadUrl = (url, name) => {
    if (!name) return url;
    const ext = getFileExtension(name);
    const baseUrl = url.split('/upload/')[0];
    const filePath = url.split('/upload/')[1];
    return `${baseUrl}/upload/fl_attachment:${name}/${filePath}`;
  };

  const isPdf = getFileExtension(documentName) === 'pdf';

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-3">
        <a 
          href={getDownloadUrl(documentUrl, documentName)} 
          download={documentName}
          onClick={(e) => e.stopPropagation()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Download
        </a>
        <button 
          onClick={onClose}
          className="text-white text-3xl hover:text-gray-300"
        >
          ×
        </button>
      </div>
      
      <div className="w-full h-full mt-12" onClick={(e) => e.stopPropagation()}>
        {isPdf ? (
          <iframe 
            src={`${documentUrl}#toolbar=0`}
            className="w-full h-full rounded-lg bg-white"
            title={documentName}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="text-xl mb-4">Preview not available for this file type</p>
            <p className="text-gray-400 mb-4">File: {documentName}</p>
            <a 
              href={documentUrl} 
              download={documentName}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};