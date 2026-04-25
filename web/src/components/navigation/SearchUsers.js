import { useState, useEffect } from 'react';
import { messageAPI } from '../../services/api';

export const SearchUsers = ({ onSelectUser, selectedId }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const res = await messageAPI.search(query);
        setUsers(res.data.users || []);
      } catch (err) {
        console.error('Failed to search:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      if (query.length >= 0) search();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="p-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
        className="input-field w-full mb-3"
      />

      {loading ? (
        <p className="text-dark/60 p-2">Searching...</p>
      ) : users.length === 0 && query ? (
        <p className="text-dark/60 p-2">No users found</p>
      ) : users.length > 0 ? (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => onSelectUser(user)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                String(selectedId) === String(user._id)
                  ? 'bg-success/30'
                  : 'hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-dark font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark truncate">{user.username}</p>
                  <p className="text-xs text-dark/60 truncate">{user.email}</p>
                  <p className="text-xs text-dark/50">{user.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-dark/60 p-2">Type to search for users</p>
      )}
    </div>
  );
};