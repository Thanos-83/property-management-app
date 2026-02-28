import { TaskDetailsSchemaType } from '@/lib/schemas/task';
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from '@dnd-kit/core';
import {
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatGreeceTime } from '@/lib/heplers';






export const SortableChecklistItem = ({
  id,
  index,
  control,
  remove,
  append,
  setValue, // <-- NEW
  currentUserId, // <-- NEW
  teamMembers, // <-- NEW
}: {
  id: string;
  index: number;
  control: Control<TaskDetailsSchemaType>;
  remove: (index: number) => void;
  append: (value: any, options?: any) => void;
  setValue: UseFormSetValue<TaskDetailsSchemaType>;
  currentUserId: string;
  teamMembers: any[];
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: 'relative' as const,
  };

  // Watch the completion status to apply the strikethrough effect dynamically
  const isCompleted = useWatch({ control, name: `taskTodos.${index}.is_completed` });


  // Watch the audit fields so we can display them
  const completedAt = useWatch({ control, name: `taskTodos.${index}.completed_datetime` });
  const completedBy = useWatch({ control, name: `taskTodos.${index}.completed_by_member` });

  // Look up the team member's name
  const completerName = teamMembers?.find(m => m.id === completedBy)?.first_name || 'a team member';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex gap-2 items-center mb-2 bg-white border border-border p-2 rounded-md transition-shadow",
        isDragging ? "shadow-md opacity-80" : "shadow-sm"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="!cursor-grab text-muted-foreground hover:text-foreground p-1 h-auto"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>

      {/* Completion Checkbox */}
      <FormField
        control={control}
        name={`taskTodos.${index}.is_completed`}
        render={({ field }) => (
          <FormItem className="flex items-center space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                 onCheckedChange={(checked: boolean) => {
                  field.onChange(checked);
                  
                  // Automatically capture WHO and WHEN  
                  if (checked) {
                    setValue(`taskTodos.${index}.completed_datetime`, new Date().toISOString(), { shouldDirty: true });
                    setValue(`taskTodos.${index}.completed_by_member`, currentUserId || null, { shouldDirty: true });
                  } else {
                    setValue(`taskTodos.${index}.completed_datetime`, null, { shouldDirty: true });
                    setValue(`taskTodos.${index}.completed_by_member`, null, { shouldDirty: true });
                  }
                }}
                className="data-[state=checked]:bg-success data-[state=checked]:border-success rounded-sm"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Description Input and Audit Trail */}
      <div className="flex flex-col w-full">
        <FormField
          control={control}
          name={`taskTodos.${index}.description`}
          render={({ field }) => (
            <FormItem className="flex-1 space-y-0">
              <FormControl>
                <Input
                  {...field}
                  className={cn(
                    "flex-1 h-8 bg-transparent border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring px-2 transition-all",
                    isCompleted && "text-muted-foreground line-through opacity-70"
                  )}
                  placeholder="Todo item description..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Append a new item and focus it instantly!
                      append({
                        id: crypto.randomUUID(), // Temp ID for dnd-kit
                        description: '',
                        is_completed: false,
                        sort_order: 0, 
                        completed_by_member: null,
                        completed_datetime: null
                      }, { shouldFocus: true });
                    }
                  }}
                />
              </FormControl>
              <FormMessage className='text-[10px]'/>
            </FormItem>
          )}
        />
        {/* Visual Audit Trail Subtext */}
          {isCompleted && completedAt && (
            <span className="text-[10px] text-muted-foreground/70 px-2 mt-0.5 truncate">
              Marked as completed by <span className='font-semibold'>{completedBy === currentUserId ? 'YOU' : completerName}</span> on <span className='font-semibold'>{format(new Date(completedAt), 'MMM d, yyyy h:mm a')} </span>
            </span>
          )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="p-1 h-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        onClick={() => remove(index)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
