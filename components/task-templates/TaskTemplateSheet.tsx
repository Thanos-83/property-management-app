'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2Icon, 
  Plus, 
  SearchIcon, 
  Trash2, 
  Sparkles, 
  Wrench, 
  Settings2, 
  CheckSquare, 
  Zap, 
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Control } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '../ui/multi-select';
import { updateTaskTemplateAction } from '@/lib/actions/taskTemplateActions';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

import { createTaskTemplateAction } from '@/lib/actions/taskTemplateActions';
import { taskTemplateSchema, TaskTemplateSchemaType } from '@/lib/schemas/task-template';

type TaskTemplateSheetProps = {
  template: any | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers?: { id: string; first_name: string; last_name: string }[];
  properties?: { id: string; title: string }[];
  priorities?: { id: number; name: string; priority_color?: string }[];
  taskTypes?: { id: string; name: string; icon_name?: string; theme_color?: string }[];
  mode?: 'create' | 'edit';
};

// --- Sortable Item Component ---
const SortableItem = ({
  id,
  index,
  control,
  remove,
  append,
}: {
  id: string;
  index: number;
  control: Control<TaskTemplateSchemaType>;
  remove: (index: number) => void;
  append: (value: { description: string }) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex gap-2 items-center mb-3 ${isDragging ? 'opacity-70' : ''}`}>
      <FormField
        control={control}
        name={`checklist.${index}.description`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <div className="flex items-center bg-white border border-input rounded-md shadow-sm focus-within:ring-1 focus-within:ring-ring">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!cursor-grab text-muted-foreground hover:text-foreground h-9 w-9 p-0 rounded-r-none"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                <Input
                  placeholder={`Step ${index + 1}...`}
                  className="h-9 bg-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 px-2 rounded-none"
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      append({ description: '' });
                    }
                  }}
                />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive rounded-l-none"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive/70" />
                  </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export function TaskTemplateSheet({ 
  template,
  isOpen,
  onOpenChange,
  teamMembers = [], 
  properties = [], 
  priorities = [],
  taskTypes = [],
  mode = 'create'
}: TaskTemplateSheetProps) {
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isCreateMode = mode === 'create';

  const form = useForm<TaskTemplateSchemaType>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      name: '',
      task_type: '',
      priority: '',
      description_notes: '',
      team_member_id: 'unassigned',
      offset_minutes: 0,
      checklist: [],
      property_ids: [],
      is_active: true,
    },
  }) as unknown as UseFormReturn<TaskTemplateSchemaType>;

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'checklist',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  // Reset form when sheet opens or template changes
  useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      form.reset({
        name: '',
        task_type: taskTypes?.[0]?.id || '', // Default to the first available task type
        priority: priorities?.[0]?.id ? String(priorities[0].id) : '',
        description_notes: '',
        team_member_id: 'unassigned',
        offset_minutes: 0,
        checklist: [],
        property_ids: [],
        is_active: true,
      });
    } else if (template) {
      // Find the matched type, handling cases where the database holds the name OR the UUID
      const matchedType = taskTypes?.find(t => t.id === template.task_type || t.name === template.task_type);

      form.reset({
        name: template.name || '',
        task_type: matchedType ? matchedType.id : (template.task_type || ''),
        priority: template.default_priority_id ? String(template.default_priority_id) : '',
        description_notes: template.description_notes || '',
        team_member_id: template.default_team_member_id || 'unassigned',
        offset_minutes: template.offset_minutes || 0,
        checklist: template.checklist_items || [], 
        property_ids: template.linked_properties?.map((p: any) => p.property_id) || [],
        is_active: typeof template.is_active === 'boolean' ? template.is_active : true,
      });
    }
  }, [isOpen, template, isCreateMode, form, taskTypes, priorities]);

  const onSubmit: SubmitHandler<TaskTemplateSchemaType> = async (formData) => {
    const validatedData = {
      ...formData,
      // team_member_id: formData.team_member_id === 'unassigned' ? null : formData.team_member_id,
      checklist: formData.checklist.map((item: any, index: number) => ({
        ...item,
        order: index + 1,
      })), 
    };
    
    setIsLoading(true);
    try {
      if (isCreateMode) {
        const response = await createTaskTemplateAction(validatedData);
        toast.success('Template created successfully!');
      } else {
        const response = await updateTaskTemplateAction({id: template.id, ...validatedData});
        toast.success('Template updated successfully!');
      }
      
      onOpenChange(false);
      // Removed router.refresh() for canvas compatibility. Handled by parent.
    } catch (error) {
      toast.error('An error occurred while saving the template.');
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  // Find the selected type object to style the header dynamically
  const currentTypeId = form.watch('task_type') || template?.task_type;
  // If it's still storing string names instead of IDs, we need to handle both cases temporarily
  const currentTypeObj = taskTypes.find(t => t.id === currentTypeId || t.name === currentTypeId);
  const isCleaning = currentTypeObj?.name === 'Cleaning' || currentTypeId === 'Cleaning';

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 flex flex-col w-full sm:max-w-[600px] bg-slate-50 border-l border-border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            
            {/* --- STICKY HEADER --- */}
            <div className="p-6 pr-14 border-b border-border bg-white shadow-sm shrink-0">
              <SheetHeader className="text-left space-y-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="p-1.5 rounded-md border shadow-sm shrink-0" 
                       style={currentTypeObj?.theme_color ? { backgroundColor: `${currentTypeObj.theme_color}1a`, color: currentTypeObj.theme_color, borderColor: `${currentTypeObj.theme_color}33` } : {}}>
                    {isCleaning ? <Sparkles className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                  </div>
                  <SheetTitle className="text-xl font-black text-foreground">
                    {isCreateMode ? "New Task Template" : "Edit Template"}
                  </SheetTitle>
                  {!isCreateMode && (
                    <Badge variant={form.watch('is_active') ? "secondary" : "outline"} className={`text-[10px] uppercase font-bold tracking-wider shadow-sm ${form.watch('is_active') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'text-muted-foreground'}`}>
                      {/* {template?.is_active ? 'Active' : 'Inactive'} */}
                      {form.watch('is_active') ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </div>
                <SheetDescription className="text-xs font-medium text-muted-foreground">
                  {isCreateMode ? "Create a reusable recipe for your tasks." : "Modify the automation rules and checklist for this template."}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* --- SCROLLABLE BODY --- */}
            <ScrollArea className="flex-1 px-6 py-4 space-y-6 overflow-hidden">
              
              {/* SECTION 1: GENERAL SETTINGS */}
              <div className="bg-white border border-border rounded-md p-5 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2 pb-3 border-b border-border/50">
                  <Settings2 className="w-4 h-4 text-muted-foreground" /> General Settings
                </h3>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-slate-50/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-bold text-foreground">Active Template</FormLabel>
                        <FormDescription className="text-[10px]">
                          When disabled, this template will be paused and stop generating new automated tasks.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-semibold">Template Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., "Deep Clean - Summer"' className="bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="task_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground font-semibold">Task Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {taskTypes.map((type) => (
                               <SelectItem key={type.id} value={type.id}>
                                 <div className="flex items-center gap-2">
                                   <div 
                                     className="w-2.5 h-2.5 rounded-full" 
                                     style={{ backgroundColor: type.theme_color || '#9ca3af' }} 
                                   />
                                   {type.name}
                                 </div>
                               </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground font-semibold">Default Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorities.map((priority) => (
                               <SelectItem key={priority.id} value={String(priority.id)}>
                                 <div className="flex items-center gap-2">
                                   <div 
                                     className="w-2.5 h-2.5 rounded-full" 
                                     style={{ backgroundColor: priority.priority_color || '#9ca3af' }} 
                                   />
                                   {priority.name}
                                 </div>
                               </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="team_member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-semibold">Default Assignee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Auto-assign to..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned" className="text-muted-foreground italic">Leave Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                             <SelectItem key={member.id} value={member.id}>
                               {member.first_name} {member.last_name}
                             </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">
                        Tasks created by this template will be automatically assigned to this person.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECTION 2: AUTOMATION & SCHEDULING */}
              <div className="bg-white border border-border rounded-md p-5 shadow-sm space-y-5 mt-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2 pb-3 border-b border-border/50">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" /> Automations
                </h3>
                
                <FormField
                  control={form.control}
                  name="property_ids"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-semibold">Apply to Properties</FormLabel>
                      <FormControl>
                        <MultiSelect
                            options={properties.map((property) => ({
                              value: property.id,
                              label: property.title,
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            responsive={true}
                            minWidth='200px'
                            maxWidth='600px'
                            variant='inverted'
                            maxCount={4}
                            className='border-border'
                            emptyIndicator={
                            <div className="text-center p-4 text-muted-foreground">
                            <SearchIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm">
                            No properties found matching your search
                            </p>
                            </div>
                            }
                            autoSize={false}
                            />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        When a booking ends at these properties, this task will be auto-generated.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offset_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-semibold">Scheduling Rule</FormLabel>
                      <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-lg border border-border/50">
                        <span className="text-sm font-medium text-foreground">Start task</span>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="w-20 bg-white text-center font-bold" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <span className="text-sm font-medium text-muted-foreground">minutes after check-out</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECTION 3: CHECKLIST BUILDER */}
              <div className="bg-white border border-border rounded-md p-5 shadow-sm space-y-4 mt-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" /> Checklist Builder
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{fields.length} Items</Badge>
                </div>
                
                {fields.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-md bg-slate-50/50">
                    <p className="text-xs font-medium text-muted-foreground mb-3">No steps defined for this template.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={fields.map((field) => field.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {fields.map((field, index) => (
                          <SortableItem
                            key={field.id}
                            id={field.id}
                            index={index}
                            control={form.control}
                            remove={remove}
                            append={append}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full bg-white border-dashed border-border hover:bg-slate-50 shadow-sm"
                  onClick={() => append({ description: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Checklist Step
                </Button>
                <FormField control={form.control} name="checklist" render={() => <FormMessage />} />
              </div>

              {/* SECTION 4: NOTES */}
              <div className="bg-white border border-border rounded-md p-5 shadow-sm space-y-4 mt-6 mb-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2 pb-3 border-b border-border/50">
                  <FileText className="w-4 h-4 text-muted-foreground" /> Internal Notes
                </h3>
                <FormField
                  control={form.control}
                  name="description_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder='Add standard instructions, lockbox codes, or reminders for the assignee...' 
                          className="min-h-[100px] bg-white resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </ScrollArea>

            {/* --- STICKY FOOTER --- */}
            <div className="p-4 border-t border-border bg-white shrink-0 flex items-center justify-end gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <Button 
                variant="outline" 
                type="button" 
                className="bg-white border-border hover:bg-muted font-semibold" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="font-bold shadow-sm"
              >
                {isLoading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Saving..." : (isCreateMode ? "Create Template" : "Save Changes")}
              </Button>
            </div>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}