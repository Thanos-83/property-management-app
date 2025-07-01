type PlaceholderChartProps = {
  title: string;
  description?: string;
};
export function PlaceholderChart({
  title,
  description,
}: PlaceholderChartProps) {
  return (
    <div className='flex flex-col bg-[theme(colors.white)] rounded-xl shadow-sm p-4 min-h-[220px]'>
      <div className='font-semibold text-[theme(colors.neutral)] mb-2'>
        {title}
      </div>
      {description && (
        <div className='text-xs text-[theme(colors.neutral)] mb-2'>
          {description}
        </div>
      )}
      <div className='flex-1 flex items-center justify-center text-[theme(colors.secondary)]'>
        <span className='opacity-30'>[chart placeholder]</span>
      </div>
    </div>
  );
}
