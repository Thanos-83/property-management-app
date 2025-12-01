import React, { memo, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Textarea } from '../ui/textarea';
import { TaskSchemaType } from '@/lib/schemas/task';
import { UseFormReturn } from 'react-hook-form';
import TodoTaskList from './TodoTaskList';

interface StepTwoProps {
  form: UseFormReturn<TaskSchemaType>;
}

export interface StepTwoRef {
  focusFirstField: () => void;
}

const StepTwo = memo(
  forwardRef<StepTwoRef, StepTwoProps>(function StepTwo({ form }, ref) {
    const notesRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focusFirstField: () => {
        notesRef.current?.focus();
      },
    }));

    return (
      <div>
        <FormField
          control={form.control}
          name='notes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} ref={notesRef} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <TodoTaskList />
      </div>
    );
  })
);

export default StepTwo;
