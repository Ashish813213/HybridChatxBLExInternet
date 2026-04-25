export const MessageBubble = ({ content, isOwn, timestamp }) => {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
        isOwn ? 'bg-success text-dark rounded-br-md' : 'bg-white/50 text-dark rounded-bl-md'
      }`}>
        <p className="text-sm">{content}</p>
        <p className="text-xs text-dark/50 mt-1 text-right">{time}</p>
      </div>
    </div>
  );
};