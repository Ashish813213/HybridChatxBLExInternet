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
import { ImageViewer } from '../components/chat/ImageViewer';
import { DocumentViewer } from '../components/chat/DocumentViewer';
import { Button } from '../components/common/Button';

const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }
  return String(value);
};

const getUserId = (currentUser) => String(currentUser?._id || currentUser?.id || '');

const appendUniqueMessage = (previousMessages, nextMessage) => {
  const nextId = getEntityId(nextMessage?._id);
  if (!nextId) {
    return [...previousMessages, nextMessage];
  }

  const exists = previousMessages.some((message) => getEntityId(message?._id) === nextId);
  if (exists) {
    return previousMessages;
  }

  return [...previousMessages, nextMessage];
};

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
  const [viewerImage, setViewerImage] = useState(null);
  const [viewerDocument, setViewerDocument] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        const selectedType = selectedChat?.type;
        const selectedId = selectedChat ? String(selectedChat._id) : null;

        if (selectedType === 'channel' && selectedId && getEntityId(data.channelId) === selectedId) {
          setMessages((prev) => appendUniqueMessage(prev, data));
          return;
        }

        if (selectedType === 'group' && selectedId && getEntityId(data.groupId) === selectedId) {
          setMessages((prev) => appendUniqueMessage(prev, data));
          return;
        }

        const msgSenderId = getEntityId(data.senderId);
        const msgReceiverId = getEntityId(data.receiverId);
        const currentUserId = getUserId(user);
        const chatId = selectedChat ? String(selectedChat._id) : null;

        if (
          chatId &&
          ((msgSenderId === chatId && msgReceiverId === currentUserId) ||
            (msgSenderId === currentUserId && msgReceiverId === chatId))
        ) {
          setMessages((prev) => appendUniqueMessage(prev, data));
        }
        
        setRefreshTrigger((prev) => prev + 1);
      };

      const handleChannelReactionUpdated = (data) => {
        if (!selectedChat || selectedChat.type !== 'channel') {
          return;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            String(msg._id) === String(data.messageId)
              ? { ...msg, reactions: data.reactions || [] }
              : msg
          )
        );
      };

      on('new_message', handleNewMessage);
      on('channel_reaction_updated', handleChannelReactionUpdated);
      return () => {
        off('new_message', handleNewMessage);
        off('channel_reaction_updated', handleChannelReactionUpdated);
      };
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
      const userId = getUserId(user);
      const chatIdStr = String(chatId);
      
      return allMessages.filter((msg) => {
        const msgSenderId = getEntityId(msg.senderId);
        const msgReceiverId = msg.receiverId ? getEntityId(msg.receiverId) : null;
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
      _id: user._id || user.id,
      username: user.username,
      email: user.email,
      isOnline: user.isOnline,
      type: 'chat'
    });
  };

  const handleSendMessage = async (content, imageUrl = null, document = null) => {
    if (!selectedChat || sending) return;
    setSending(true);

    try {
      let payload;
      if (selectedChat.type === 'chat') {
        payload = { receiverId: selectedChat._id, content, imageUrl, documentUrl: document?.url, documentName: document?.name, documentType: document?.type, mode: 'internet' };
      } else if (selectedChat.type === 'group') {
        payload = { groupId: selectedChat._id, content, imageUrl, documentUrl: document?.url, documentName: document?.name, documentType: document?.type, mode: 'internet' };
      } else {
        payload = { channelId: selectedChat._id, content, imageUrl, documentUrl: document?.url, documentName: document?.name, documentType: document?.type, mode: 'internet' };
      }

      const res = await messageAPI.send(payload);

      if (res.data.message) {
        setMessages((prev) => appendUniqueMessage(prev, res.data.message));
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
      const res = await groupAPI.create({ name, members: [] });
      await fetchGroups();

      const createdCode = res.data?.inviteCode || res.data?.group?.inviteCode;
      if (createdCode) {
        alert(`Group created. Share this code to invite users: ${createdCode}`);
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleJoinGroup = async () => {
    const code = prompt('Enter group code:');
    if (!code) return;

    try {
      const res = await groupAPI.joinByCode(code);
      await fetchGroups();

      if (res.data?.group?._id) {
        await handleSelectGroup(res.data.group);
      }

      if (res.data?.joined) {
        alert('Joined group successfully');
      } else {
        alert('You are already a member of this group');
      }
    } catch (err) {
      console.error('Failed to join group:', err);
      alert(err?.response?.data?.error || 'Failed to join group');
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
      emit('join_group', String(group._id));
      setSelectedChat({ ...group, type: 'group' });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch group messages:', err);
    }
  };

  const handleSelectChannel = async (channel) => {
    try {
      const res = await channelAPI.getMessages(channel._id);
      emit('join_channel', String(channel._id));
      setSelectedChat({ ...channel, type: 'channel' });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch channel messages:', err);
    }
  };

  const handleReactToChannelMessage = async (messageId, type) => {
    if (!selectedChat || selectedChat.type !== 'channel') return;

    try {
      const res = await channelAPI.reactToMessage(selectedChat._id, messageId, type);
      const updated = res.data?.message;
      if (!updated) return;

      setMessages((prev) =>
        prev.map((msg) => (String(msg._id) === String(messageId) ? updated : msg))
      );
    } catch (err) {
      console.error('Failed to react to channel post:', err);
      alert(err?.response?.data?.error || 'Failed to react to channel post');
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
                    key={getEntityId(msg._id) || idx}
                    content={msg.content}
                    imageUrl={msg.imageUrl}
                    documentUrl={msg.documentUrl}
                    documentName={msg.documentName}
                    documentType={msg.documentType}
                    isOwn={getEntityId(msg.senderId) === getUserId(user)}
                    timestamp={msg.timestamp}
                    onImageClick={setViewerImage}
                    onDocumentClick={setViewerDocument}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <Button onClick={handleCreateGroup} className="w-full">Create Group</Button>
          <Button onClick={handleJoinGroup} variant="accent" className="w-full">Join Group</Button>
        </div>
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
                <p className="text-xs text-dark/50">Code: {group.inviteCode || 'Not available'}</p>
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
                <MessageBubble key={getEntityId(msg._id) || idx} content={msg.content} imageUrl={msg.imageUrl} documentUrl={msg.documentUrl} documentName={msg.documentName} documentType={msg.documentType} isOwn={getEntityId(msg.senderId) === getUserId(user)} timestamp={msg.timestamp} onImageClick={setViewerImage}
                    onDocumentClick={setViewerDocument} />
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
          (() => {
            const currentUserId = getUserId(user);
            const isChannelCreator = getEntityId(selectedChat.adminId) === currentUserId;

            return (
          <>
            {renderChatHeader()}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={getEntityId(msg._id) || idx}
                  content={msg.content}
                  imageUrl={msg.imageUrl}
                  documentUrl={msg.documentUrl}
                  documentName={msg.documentName}
                  documentType={msg.documentType}
                  isOwn={getEntityId(msg.senderId) === currentUserId}
                  reactions={msg.reactions || []}
                  canReact={!isChannelCreator}
                  onReact={(type) => handleReactToChannelMessage(msg._id, type)}
                  timestamp={msg.timestamp}
                  onImageClick={setViewerImage}
                    onDocumentClick={setViewerDocument}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            {isChannelCreator ? (
              <ChatInput onSend={handleSendMessage} disabled={sending} />
            ) : (
              <div className="p-4 glass mt-auto text-sm text-dark/70">
                Only the channel creator can post. Members can react to posts.
              </div>
            )}
          </>
            );
          })()
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
      {viewerImage && <ImageViewer imageUrl={viewerImage} onClose={() => setViewerImage(null)} />}
      {viewerDocument && (
        <DocumentViewer 
          documentUrl={viewerDocument.url} 
          documentName={viewerDocument.name}
          onClose={() => setViewerDocument(null)} 
        />
      )}
    </div>
  );
}