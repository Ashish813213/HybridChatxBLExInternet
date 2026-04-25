import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, onTabChange }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const tabs = [
    { id: 'chats', label: 'Chats' },
    { id: 'groups', label: 'Groups' },
    { id: 'channels', label: 'Channels' },
  ];

  return (
    <div className="w-20 md:w-64 glass h-screen flex flex-col">
      <div className="p-4 border-b border-dark/10">
        <h1 className="text-xl font-bold text-dark hidden md:block">HybridChat</h1>
        <h1 className="text-xl font-bold text-dark md:hidden">HC</h1>
      </div>

      <div className="flex-1 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full px-4 py-3 text-left transition-all ${
              activeTab === tab.id
                ? 'bg-success/30 text-dark'
                : 'text-dark/70 hover:bg-white/20'
            }`}
          >
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.label[0]}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-dark/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-dark text-sm font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-dark">{user?.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-accent hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
};