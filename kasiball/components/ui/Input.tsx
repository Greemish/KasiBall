type InputProps = {
  placeholder?: string;
  type?: string;
  className?: string;
};

export function Input({ placeholder, type = 'text', className = '' }: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white ${className}`}
    />
  );
}
