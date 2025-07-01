'use client';

export default function FooterUpgradeCard() {
  return (
    <div className='bg-primary-main text-white rounded-md p-4 flex flex-col items-center shadow'>
      <span className='text-sm mb-2 text-center'>
        Get detailed analytics
        <br />
        for help you, upgrade pro
      </span>
      <button className='mt-2 bg-primary-accent hover:bg-primary text-white py-1 rounded transition-all w-full'>
        Upgrade Now
      </button>
    </div>
  );
}
