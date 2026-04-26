const REACTION_OPTIONS = [
  { type: 'like', label: 'Like' },
  { type: 'love', label: 'Love' },
  { type: 'clap', label: 'Clap' },
];

const buildReactionSummary = (reactions = []) => {
  return reactions.reduce((acc, reaction) => {
    const key = reaction.type || 'like';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

export const MessageBubble = ({ content, isOwn, timestamp, reactions = [], canReact = false, onReact }) => {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const reactionSummary = buildReactionSummary(reactions);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
        isOwn ? 'bg-success text-dark rounded-br-md' : 'bg-white/50 text-dark rounded-bl-md'
      }`}>
        <p className="text-sm">{content}</p>
        {Object.keys(reactionSummary).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-dark/70">
            {Object.entries(reactionSummary).map(([type, count]) => (
              <span key={type} className="px-2 py-1 rounded-full bg-white/60">
                {type} {count}
              </span>
            ))}
          </div>
        )}
        {canReact && typeof onReact === 'function' && (
          <div className="mt-2 flex flex-wrap gap-2">
            {REACTION_OPTIONS.map((reaction) => (
              <button
                key={reaction.type}
                type="button"
                onClick={() => onReact(reaction.type)}
                className="px-2 py-1 rounded-md text-xs bg-white/60 hover:bg-white/80 transition-all"
              >
                {reaction.label}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-dark/50 mt-1 text-right">{time}</p>
      </div>
    </div>
  );
};