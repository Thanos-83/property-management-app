'use client';

import { useTransition } from 'react';
import { Button } from '../ui/button';
import { deletePropertyAction } from '@/lib/actions/propertiesActions';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

function DeletePropertyBtn({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDeleteProperty = async (propertyId: string) => {
    startTransition(async () => {
      const result = await deletePropertyAction(propertyId);
      if (result?.result === 'success') {
        setTimeout(() => toast.success('Property deleted successfully'), 500);
      } else if (result?.result === 'fail') {
        toast.error(result?.error?.message || 'Failed to delete property');
      }
    });
  };

  return (
    <Button
      disabled={isPending}
      onClick={() => handleDeleteProperty(propertyId)}
      variant='destructive'
      size='sm'>
      <Loader2Icon
        className={`animate-spin ${isPending ? 'block' : 'hidden'}`}
      />
      Delete
    </Button>
  );
}

export default DeletePropertyBtn;
