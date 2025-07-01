'use client';

import { deletePropertyIcalAction } from '@/lib/actions/propertiesActions';
import { Loader2Icon, Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

function DeletePropertyIcalUrlBtn({ icalId }: { icalId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDeletePropertyUrl = async (icalId: string) => {
    startTransition(async () => {
      const result = await deletePropertyIcalAction(icalId);
      if (result?.result === 'success') {
        setTimeout(() => toast.success('iCal URL deleted successfully'), 500);
      } else if (result?.result === 'fail') {
        toast.error(result?.error?.message || 'Failed to delete iCal URL');
      }
    });
  };

  return (
    <Button
      variant='ghost'
      className='!p-1'
      // type='submit'
      onClick={() => handleDeletePropertyUrl(icalId)}
      disabled={isPending}>
      <Loader2Icon
        className={`animate-spin ${isPending ? 'block' : 'hidden'}`}
      />
      <Trash2
        size={24}
        className={`w-14 h-14 ${isPending ? 'hidden' : 'block'} `}
      />
    </Button>
  );
}

export default DeletePropertyIcalUrlBtn;
