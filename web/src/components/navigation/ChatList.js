import { useState, useEffect } from 'react';
import { messageAPI } from '../../services/api';

export const ChatList = ({ onSelectChat, selectedId, refreshTrigger }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await messageAPI.conversations();
        setConversations(res.data.conversations || []);
      } catch (err) {
        console.error('Failed to fetch chats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [refreshTrigger]);

  if (loading) {
    return <div className="p-4 text-dark/70">Loading...</div>;
  }

  return (
    <div className="space-y-2 p-2 overflow-y-auto max-h-screen">
      {conversations.length === 0 ? (
        <p className="p-4 text-dark/70 text-center">No conversations yet</p>
      ) : (
        conversations.map((chat, idx) => (
          <div
            key={idx}
            onClick={() => onSelectChat(chat)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              String(selectedId) === String(chat._id)
                ? 'bg-success/30'
                : 'hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-dark font-bold">
                {chat.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark truncate">{chat.username || 'Unknown User'}</p>
                <p className="text-xs text-dark/60 truncate">
                  {chat.lastMessage?.content || 'No messages'}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};