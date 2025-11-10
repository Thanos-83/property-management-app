'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import { addTaskAction } from '@/lib/actions/taskActions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { createClient } from '@/lib/utils/supabase/client';
import { PlusIcon } from 'lucide-react';

const taskTypes = ['cleaning', 'maintenance', 'inspection', 'other'];

type Property = {
  id: string;
  title: string;
};

type TaskMember = {
  id: string;
  name: string;
};

// type AddTaskModalProps = {
//   onSuccess?: () => void;
// };

export default function AddTaskModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      type: '',
      scheduled_date: '',
      notes: '',
      team_member_id: null,
      property_id: '',
      status: 'pending',
      assigner_id: '',
    },
  });

  console.log('Form error: ', form.formState.errors);

  // Add a state to track if the required fields of the current step are valid
  const [isStepValid, setIsStepValid] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.app_metadata.role === 'admin') {
        form.setValue('assigner_id', user?.id);
      }
    }

    fetchUserData();
    async function fetchProperties() {
      const response = await getPropertiesDataAction();
      if (response.status === 200 && response.properties) {
        setProperties(response.properties);
      } else {
        toast.error('Failed to load properties');
      }
    }
    fetchProperties();

    async function fetchTaskMembers() {
      const response = await getTaskMembersAction();
      if (response.status === 200 && response.members) {
        const members = response.members.map((member) => {
          return {
            id: member.id,
            name: member.first_name + ' ' + member.last_name,
          };
        });
        setTaskMembers(members);
      } else {
        toast.error('Failed to fetch task members');
      }
    }
    fetchTaskMembers();
  }, [form]);

  // Check if current step is valid - this runs once when form loads and whenever the form state changes
  useEffect(() => {
    const checkStepValidity = () => {
      if (currentStep === 1) {
        // define the mandatory fields for step 1
        const requiredFields = ['property_id', 'type', 'scheduled_date'];

        // Check if all required fields have values and no errors
        const allValid = requiredFields.every((field) => {
          const value = form.getValues(field as keyof TaskSchemaType);
          return (
            value &&
            value !== '' &&
            !form.formState.errors[field as keyof TaskSchemaType]
          );
        });

        setIsStepValid(allValid);
      }
    };

    // Subscribe to form state changes
    const subscription = form.watch(() => {
      checkStepValidity();
    });

    // Initial check
    checkStepValidity();

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [form, currentStep]);

  const nextStep = async () => {
    const currentFields = getFieldsForStep(currentStep);

    // Trigger validation for all fields in the current step
    await Promise.all(
      currentFields.map((field) => form.trigger(field as keyof TaskSchemaType))
    );

    // Check if all required fields are valid
    if (currentStep === 1) {
      const requiredFields = ['property_id', 'type', 'scheduled_date'];
      const allValid = requiredFields.every((field) => {
        const value = form.getValues(field as keyof TaskSchemaType);
        return (
          value &&
          value !== '' &&
          !form.formState.errors[field as keyof TaskSchemaType]
        );
      });

      if (allValid) {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      }
    } else {
      // For other steps, just advance if there are no validation errors
      const hasErrors = currentFields.some(
        (field) => form.formState.errors[field as keyof TaskSchemaType]
      );

      if (!hasErrors) {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 1:
        return [
          'property_id',
          'type',
          'scheduled_date',
          'team_member_id',
          'assigner_id',
        ];
      case 2:
        return ['notes'];
      default:
        return [];
    }
  };

  async function onSubmit(data: TaskSchemaType) {
    setIsLoading(true);
    try {
      // Map camelCase keys from form to snake_case for DB
      const payload = {
        property_id: data.property_id,
        team_member_id: data.team_member_id,
        assigner_id: data.assigner_id,
        scheduled_date: data.scheduled_date,
        notes: data.notes,
        type: data.type,
        status: 'pending',
      };

      const response = await addTaskAction(payload);

      if (response.status === 201) {
        form.reset();
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.app_metadata.role === 'admin') {
          form.setValue('assigner_id', user?.id);
        }
        setTimeout(() => {
          setOpen(false);
          setIsLoading(false);
          setCurrentStep(1);
          toast.success('Task added successfully');

          // onSuccess?.();
        }, 200);
      } else {
        toast.error('Failed to add task');
      }
    } catch (error) {
      console.log('Error adding task: ', error);
      toast.error('An error occurred while adding task');
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <PlusIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Add a new task for a property.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Step indicator */}
            <div className='flex items-center justify-center mb-6'>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full 
                      ${
                        index + 1 === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : index + 1 < currentStep
                            ? 'bg-primary/80 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                    {index + 1 < currentStep ? (
                      <Check className='h-4 w-4' />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`w-10 h-1 mx-1 ${index + 1 < currentStep ? 'bg-primary' : 'bg-muted'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* Step 1: Basic Task Information */}
            {currentStep === 1 && (
              <>
                <FormField
                  control={form.control}
                  name='property_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select property' />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select task type' />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='scheduled_date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='team_member_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Assignee (optional - can be assigned later)
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select assignee' />
                          </SelectTrigger>

                          <SelectContent>
                            {taskMembers.length === 0 && (
                              <SelectItem value='no-taskMembers' disabled>
                                No task members available
                              </SelectItem>
                            )}
                            {taskMembers.map((taskMember) => (
                              <SelectItem
                                key={taskMember.id}
                                value={taskMember.id}>
                                {taskMember.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='assigner_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} value={field.value} hidden />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 2: Additional Information */}
            {currentStep === 2 && (
              <>
                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <div className='flex justify-between space-x-2'>
              {currentStep > 1 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={prevStep}
                  className='flex items-center'
                  disabled={isLoading}>
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>
              )}

              <div className='flex-1'></div>

              <DialogClose asChild>
                <Button variant='outline' type='button' disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>

              {currentStep < totalSteps ? (
                <Button
                  type='button'
                  onClick={(e) => {
                    e.preventDefault();
                    nextStep();
                  }}
                  className='flex items-center'
                  disabled={!isStepValid}>
                  Next
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              ) : (
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Task'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
