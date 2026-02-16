'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskTemplateSchema, TaskTemplateSchemaType } from '@/lib/schemas/task-template';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2Icon, Plus, PlusIcon, SearchIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MultiSelect } from '@/components/ui/multi-select';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
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
import { createTaskTemplateAction } from '@/lib/actions/taskTemplateActions';
import Link from 'next/link';


type CreateTemplateFormProps = {
  teamMembers?: { id: string; first_name: string; last_name: string }[];
  properties?: { id: string; title: string }[];
  priorities?: { id: number; name: string; color: string }[];
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
    position: 'relative' as const, // Ensure z-index works
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center mb-2">
 
      <FormField
        control={control}
        name={`checklist.${index}.description`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <InputGroup>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!cursor-grab text-muted-foreground hover:text-foreground"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                <InputGroupInput
                  placeholder={`Step ${index + 1}...`}
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
                    className="p-2"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export function CreateTemplateForm({ 
  teamMembers = [], 
  properties = [], 
  priorities = [] 
}: CreateTemplateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TaskTemplateSchemaType>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      name: '',
      task_type: '' as any,
      priority: '' as any,
      description_notes: '',
      team_member_id: '' as any,
      offset_minutes: 0,
      checklist: [],
      property_ids: '' as any,
    },
  }) as unknown as UseFormReturn<TaskTemplateSchemaType>;

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'checklist',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);

      move(oldIndex, newIndex);
    }
  };

  const onSubmit: SubmitHandler<TaskTemplateSchemaType> = async (formData) => {
    const validadedData = {
      ...formData,
      checklist: formData.checklist.map((item, index) => ({
        ...item,
        order: index + 1,
      })),
    };
    setIsLoading(true);
    
    const response = await createTaskTemplateAction(validadedData);

    console.log('Form Data:', validadedData);
    console.log('Response:', response);
        
    toast.success('Template created successfully (Simulation)');
    setIsLoading(false);
    form.reset(); 
    // In real implementation, might redirect or reset
  };
  


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mr-auto space-y-4">
        {/* 1. Header Information */}
        <Card className='rounded-md border-border'>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Basic information about this task template.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., "Deep Clean - Summer"' {...field} />
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
                  <FormItem >
                    <FormLabel>Task Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inspection">Inspection</SelectItem>
                        <SelectItem value="Meet & Greet">Meet & Greet</SelectItem>
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
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Define priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map((priority) => (
                           <SelectItem key={priority.id} value={String(priority.id)}>
                             <div className="flex items-center gap-2">
                               <div 
                                 className="w-3 h-3 rounded-full" 
                                 style={{ backgroundColor: priority.color }} 
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
              name="description_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description & Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='e.g., "Standard turnover instructions. Remember to check the balcony door."' 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team_member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Assignee (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full max-w-lg">
                          <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.map((member) => (
                           <SelectItem key={member.id} value={member.id}>
                             <div className="flex items-center gap-2">
                               {member.first_name + ' ' + member.last_name}
                             </div>
                           </SelectItem>
                        ))}
                         {teamMembers.length === 0 && (
                            // Fallback if no priorities loaded
                            <>
                              <SelectItem value="">
                                <div> <p className="text-center"> No team members found </p> 
                                <Link href="/team-members" className="text-center"> Add team members <PlusIcon className="w-4 h-4 ml-2" /> </Link>
                                </div>
                              </SelectItem>
                            </>
                        )}
                      </SelectContent>
                    </Select>
                  {/* <FormControl>
                    <MultiSelect
                      options={teamMembers.map((member) => ({
                        value: member.id,
                        label: `${member.first_name} ${member.last_name}`,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      responsive={true}
                      minWidth='200px'
                      maxWidth='600px'
                      variant='inverted'
                      maxCount={4}
                      animationConfig={{
                        badgeAnimation: "none",
                        popoverAnimation: "none",
                        optionHoverAnimation: "none",
                      }}
                      className='border-input'
                      emptyIndicator={
                        <div className="text-center p-4 text-muted-foreground">
                          <SearchIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm">
                            No team members found matching your search
                          </p>
                        </div>
                      }
                      autoSize={false}
                    />
                  </FormControl> */}
                  <FormMessage />
                </FormItem>
              )}
            />
        
          </CardContent>
        </Card>

        {/* 2. Scheduling Rule */}
        <Card className='rounded-md border-border'>
          <CardHeader>
            <CardTitle>Scheduling Rule</CardTitle>
            <CardDescription>When should this task be scheduled relative to the booking?</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="offset_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule this task...</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        type="number" 
                        className="w-24" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">minutes after checkout</span>
                  </div>
                  <FormDescription>
                    Use 0 for immediately after checkout.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 3. The Checklist */}
        <Card className='rounded-md border-border'>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>Create a todo list of job steps to complete for this task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ description: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            {/* Show error for the array itself if it has minimum length validation */}
            <FormField
              control={form.control}
              name="checklist"
              render={() => <FormMessage />}
            />
          </CardContent>
        </Card>

        {/* 4. The Application (Properties) */}
        <Card className='rounded-md border-border'>
          <CardHeader>
            <CardTitle>Apply to Properties</CardTitle>
            <CardDescription>Select which properties should use this template automation.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="property_ids"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Properties</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
             <Button disabled={isLoading} type='submit' className="w-full md:w-auto">
                <Loader2Icon
                  className={`mr-2 h-4 w-4 animate-spin ${isLoading ? 'block' : 'hidden'}`}
                />
                Create Template
             </Button>
        </div>

      </form>
    </Form>
  );
}
