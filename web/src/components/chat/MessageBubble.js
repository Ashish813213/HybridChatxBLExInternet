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

export const MessageBubble = ({ content, imageUrl, documentUrl, documentName, documentType, isOwn, timestamp, reactions = [], canReact = false, onReact, onImageClick, onDocumentClick }) => {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const reactionSummary = buildReactionSummary(reactions);

  const getFileIcon = () => {
    if (!documentType) return '📄';
    if (documentType.includes('pdf')) return '📕';
    if (documentType.includes('word') || documentType.includes('doc')) return '📘';
    if (documentType.includes('sheet') || documentType.includes('excel') || documentType.includes('xlsx')) return '📗';
    if (documentType.includes('presentation') || documentType.includes('powerpoint') || documentType.includes('ppt')) return '📙';
    if (documentType.includes('zip') || documentType.includes('rar')) return '📦';
    return '📄';
  };

  const getDownloadUrl = (url, name) => {
    if (!name) return url;
    const baseUrl = url.split('/upload/')[0];
    const filePath = url.split('/upload/')[1];
    return `${baseUrl}/upload/fl_attachment:${name}/${filePath}`;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
        isOwn ? 'bg-success text-dark rounded-br-md' : 'bg-white/50 text-dark rounded-bl-md'
      }`}>
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Shared image" 
            className="rounded-lg mb-2 max-w-full cursor-zoom-in" 
            style={{ maxWidth: '200px' }}
            onClick={() => onImageClick?.(imageUrl)}
          />
        )}
        {documentUrl && (
          <div 
            onClick={() => onDocumentClick?.({ url: documentUrl, name: documentName })}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-white/80 mb-2 cursor-pointer"
          >
            <span className="text-2xl">{getFileIcon()}</span>
            <span className="text-sm truncate flex-1">{documentName || 'Document'}</span>
            <a 
              href={getDownloadUrl(documentUrl, documentName)} 
              download={documentName}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ↓
            </a>
          </div>
        )}
        {content && <p className="text-sm">{content}</p>}
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