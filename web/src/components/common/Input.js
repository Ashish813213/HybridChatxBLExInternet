export const Input = ({ type = 'text', value, onChange, placeholder, required, className = '' }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`input-field ${className}`}
    />
  );
};