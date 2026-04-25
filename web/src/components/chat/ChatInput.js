import { useState } from 'react';
import { Button } from '../common/Button';

export const ChatInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 glass mt-auto">
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