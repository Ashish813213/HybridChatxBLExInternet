import { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { messageAPI } from '../../services/api';

export const ChatInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await messageAPI.uploadImage(formData);
      if (res.data.imageUrl) {
        onSend(message, res.data.imageUrl);
        setMessage('');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message, null);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 glass mt-auto">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="px-3 text-xl hover:bg-white/20 rounded-lg transition-colors"
      >
        {uploading ? '...' : '📷'}
      </button>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="input-field flex-1"
      />
      <Button type="submit" disabled={disabled || !message.trim()}>
        Send
      </Button>
    </form>
  );
};