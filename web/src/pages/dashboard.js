import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { messageAPI, groupAPI, channelAPI } from '../services/api';
import { Sidebar } from '../components/navigation/Sidebar';
import { ChatList } from '../components/navigation/ChatList';
import { SearchUsers } from '../components/navigation/SearchUsers';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { Button } from '../components/common/Button';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { socket, connected, emit, on, off } = useSocket();
  const [activeTab, setActiveTab] = useState('chats');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [channels, setChannels] = useState([]);
  const [sending, setSending] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        const msgSenderId = String(data.senderId);
        const msgReceiverId = String(data.receiverId);
        const currentUserId = String(user?._id);
        const chatId = selectedChat ? String(selectedChat._id) : null;

        if (chatId && (msgSenderId === chatId || msgReceiverId === chatId)) {
          setMessages((prev) => [...prev, data]);
        }
        
        setRefreshTrigger((prev) => prev + 1);
      };
      on('new_message', handleNewMessage);
      return () => off('new_message', handleNewMessage);
    }
  }, [socket, user, selectedChat, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await messageAPI.conversations();
      return res.data.conversations || [];
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      return [];
    }
  };

  const fetchMessagesForChat = async (chatId) => {
    try {
      const res = await messageAPI.sync();
      const allMessages = res.data.messages || [];
      const userId = String(user?._id);
      const chatIdStr = String(chatId);
      
      return allMessages.filter((msg) => {
        const msgSenderId = String(msg.senderId);
        const msgReceiverId = msg.receiverId ? String(msg.receiverId) : null;
        return (msgSenderId === chatIdStr && msgReceiverId === userId) ||
               (msgSenderId === userId && msgReceiverId === chatIdStr);
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      return [];
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat({ ...chat, type: 'chat' });
    setShowSearch(false);
    fetchMessagesForChat(chat._id).then((msgs) => {
      setMessages(msgs);
    });
  };

  const handleUserSelect = (user) => {
    handleSelectChat({
      _id: user._id,
      username: user.username,
      email: user.email,
      isOnline: user.isOnline,
      type: 'chat'
    });
  };

  const handleSendMessage = async (content) => {
    if (!selectedChat || sending) return;
    setSending(true);

    try {
      let payload;
      if (selectedChat.type === 'chat') {
        payload = { receiverId: selectedChat._id, content, mode: 'internet' };
      } else if (selectedChat.type === 'group') {
        payload = { groupId: selectedChat._id, content, mode: 'internet' };
      } else {
        payload = { channelId: selectedChat._id, content, mode: 'internet' };
      }

      const res = await messageAPI.send(payload);

      if (res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        emit('send_message', { ...payload, content });
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async () => {
    const name = prompt('Enter group name:');
    if (!name) return;
    try {
      await groupAPI.create({ name, members: [] });
      fetchGroups();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleCreateChannel = async () => {
    const name = prompt('Enter channel name:');
    if (!name) return;
    try {
      await channelAPI.create({ name, isPublic: true });
      fetchChannels();
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleSubscribeChannel = async (channelId, e) => {
    e.stopPropagation();
    try {
      await channelAPI.subscribe(channelId);
      fetchChannels();
    } catch (err) {
      console.error('Failed to subscribe:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await groupAPI.getAll();
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await channelAPI.getAll();
      setChannels(res.data.channels || []);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'groups') fetchGroups();
    if (activeTab === 'channels') fetchChannels();
  }, [activeTab]);

  const handleSelectGroup = async (group) => {
    try {
      const res = await groupAPI.getMessages(group._id);
      setSelectedChat({ ...group, type: 'group' });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch group messages:', err);
    }
  };

  const handleSelectChannel = async (channel) => {
    try {
      const res = await channelAPI.getMessages(channel._id);
      setSelectedChat({ ...channel, type: 'channel' });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch channel messages:', err);
    }
  };

  const renderChatHeader = () => (
    <div className="p-4 glass border-b border-dark/10">
      <h2 className="font-bold text-dark">
        {selectedChat.type === 'channel' ? '# ' : ''}
        {selectedChat.name || selectedChat.username || 'Chat'}
      </h2>
      <p className="text-xs text-dark/60">
        {selectedChat.type === 'chat' ? (connected ? 'Online' : 'Connecting...') : 
         selectedChat.type === 'channel' ? (selectedChat.isPublic ? 'Public Channel' : 'Private Channel') : 
         'Group Chat'}
      </p>
    </div>
  );

  const renderChatsTab = () => (
    <>
      <div className="w-1/3 border-r border-dark/10 flex flex-col">
        <div className="p-2 border-b border-dark/10">
          <Button onClick={() => setShowSearch(!showSearch)} className="w-full text-sm">
            {showSearch ? 'Show Chats' : 'New Chat'}
          </Button>
        </div>
        {showSearch ? (
          <SearchUsers onSelectUser={handleUserSelect} selectedId={selectedChat?._id} />
        ) : (
          <ChatList onSelectChat={handleSelectChat} selectedId={selectedChat?._id} refreshTrigger={refreshTrigger} />
        )}
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {renderChatHeader()}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-dark/60 text-center">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <MessageBubble
                    key={idx}
                    content={msg.content}
                    isOwn={String(msg.senderId) === String(user?._id)}
                    timestamp={msg.timestamp}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSendMessage} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dark/60">
            {showSearch ? 'Select a user to start chatting' : 'Select a conversation'}
          </div>
        )}
      </div>
    </>
  );

  const renderGroupsTab = () => (
    <>
      <div className="w-1/3 border-r border-dark/10 p-4">
        <Button onClick={handleCreateGroup} className="w-full mb-4">Create Group</Button>
        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="text-dark/60">No groups yet</p>
          ) : (
            groups.map((group, idx) => (
              <div key={idx} onClick={() => handleSelectGroup(group)}
                className={`p-3 rounded-lg cursor-pointer ${
                  selectedChat?._id === group._id ? 'bg-success/30' : 'hover:bg-white/20'
                }`}>
                <p className="font-medium text-dark">{group.name}</p>
                <p className="text-xs text-dark/60">{group.members?.length || 0} members</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChat && selectedChat.type === 'group' ? (
          <>
            {renderChatHeader()}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} content={msg.content} isOwn={false} timestamp={msg.timestamp} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSendMessage} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dark/60">Select a group</div>
        )}
      </div>
    </>
  );

  const renderChannelsTab = () => (
    <>
      <div className="w-1/3 border-r border-dark/10 p-4">
        <Button onClick={handleCreateChannel} className="w-full mb-4">Create Channel</Button>
        <div className="space-y-2">
          {channels.length === 0 ? (
            <p className="text-dark/60">No channels yet</p>
          ) : (
            channels.map((channel, idx) => (
              <div key={idx} onClick={() => handleSelectChannel(channel)}
                className={`p-3 rounded-lg cursor-pointer ${
                  selectedChat?._id === channel._id ? 'bg-success/30' : 'hover:bg-white/20'
                }`}>
                <p className="font-medium text-dark"># {channel.name}</p>
                <p className="text-xs text-dark/60">{channel.isPublic ? 'Public' : 'Private'}</p>
                <button onClick={(e) => handleSubscribeChannel(channel._id, e)}
                  className="text-xs text-accent mt-1">Subscribe</button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChat && selectedChat.type === 'channel' ? (
          <>
            {renderChatHeader()}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} content={msg.content} isOwn={false} timestamp={msg.timestamp} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSendMessage} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dark/60">Select a channel</div>
        )}
      </div>
    </>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex">
        {activeTab === 'chats' && renderChatsTab()}
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'channels' && renderChannelsTab()}
      </div>
    </div>
  );
}