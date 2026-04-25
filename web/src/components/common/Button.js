export const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled, className = '' }) => {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-accent';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};