type OverviewCardProps = {
  title: string;
  value: string;
  sub: string;
  subValue: string;
  positive?: boolean;
};
export function OverviewCard({
  title,
  value,
  sub,
  subValue,
  positive = true,
}: OverviewCardProps) {
  return (
    <div className='bg-[theme(colors.white)] rounded-xl shadow-sm p-4 flex flex-col gap-2 min-w-[140px]'>
      <div className='font-semibold text-[theme(colors.neutral)]'>{title}</div>
      <div className='text-2xl font-bold text-[theme(colors.dark)]'>
        {value}
      </div>
      <div
        className={`text-xs flex items-center gap-1 ${
          positive ? 'text-green-600' : 'text-red-600'
        }`}>
        {subValue}
        <span className='text-[theme(colors.neutral)]'>{sub}</span>
      </div>
    </div>
  );
}
