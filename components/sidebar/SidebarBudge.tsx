export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className='bg-[theme(colors.primary-accent)] text-[theme(colors.white)] text-xs px-2 py-0.5 rounded-full ml-2'>
      {children}
    </span>
  );
}
