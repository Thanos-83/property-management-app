import { Loader2Icon } from 'lucide-react';
import React from 'react';

function LoadingSpinner() {
  return (
    <div className='flex items-center justify-center h-96'>
      <Loader2Icon className='w-8 h-8 animate-spin' />
      <span className='ml-2'>Loading calendar...</span>
    </div>
  );
}

export default LoadingSpinner;
