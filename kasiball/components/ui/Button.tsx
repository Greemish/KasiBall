type ButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function Button({ children, className = '' }: ButtonProps) {
  return (
    <button className={`rounded bg-blue-600 px-4 py-2 text-white ${className}`}>
      {children}
    </button>
  );
}
