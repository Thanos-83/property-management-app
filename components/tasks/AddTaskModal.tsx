'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import {
  createTaskAction,
  fetchTaskPrioritiesAction,
} from '@/lib/actions/taskActions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { createClient } from '@/lib/utils/supabase/client';
import { PlusIcon } from 'lucide-react';
import StepOne from './StepOne';
import StepTwo, { StepTwoRef } from './StepTwo';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useRouter } from 'next/navigation';

import { TaskPriority } from '@/types/taskTypes';

type Property = {
  id: string;
  title: string;
};

type TaskMember = {
  id: string;
  name: string;
};

import { Calendar, Home, Loader2, User } from 'lucide-react';

// ... (props interfaces)

export default function AddTaskModal({
  bookingId,
  propertyId,
  guestName,
  propertyTitle,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  hideTrigger = false,
  properties = [],
  members = [],
  priorities = [],
}: {
  bookingId?: string;
  propertyId?: string;
  guestName?: string;
  propertyTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  properties?: Property[];
  members?: TaskMember[];
  priorities?: TaskPriority[];
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen !== 'undefined';
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && setControlledOpen ? setControlledOpen : setInternalOpen;

  // ... (rest of state)
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>(members);
  const [taskPriorities, setTaskPriorities] = useState<TaskPriority[]>(priorities);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const stepTwoRef = React.useRef<StepTwoRef>(null);
  const router = useRouter();  

  const defaultValues: TaskSchemaType = {
    type: '',
    scheduled_date: '',
    notes: '',
    team_member_id: null,
    property_id: propertyId || '',
    status: 'pending',
    priority: 1,
    assigner_id: '',
    // This must be an empty array to match the Zod default behavior
    subtasks: [],
  };
  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues,
    mode: 'onBlur',
  });

  // Add a state to track if the required fields of the current step are valid
  const [isStepValid, setIsStepValid] = useState(false);

  // Fetch all initially nessesary data for the selects.
  // Fetch user data for assigner_id
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
  }, [form]);

  // Update local state if props change
  useEffect(() => {
    setTaskMembers(members);
    setTaskPriorities(priorities);
  }, [members, priorities]);

  // console.log('Task priorities: ', taskPriorities);

  // Check if current step is valid - this runs once when form loads and whenever the form state changes
  useEffect(() => {
    const checkStepValidity = () => {
      if (currentStep === 1) {
        // define the mandatory fields for step 1
        const requiredFields = [
          'property_id',
          'type',
          'priority',
          'scheduled_date',
        ];

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
        setCurrentStep((prev) => {
          const nextStep = Math.min(prev + 1, totalSteps);
          // Focus on the first field of step 2 after state update
          if (nextStep === 2) {
            setTimeout(() => {
              stepTwoRef.current?.focusFirstField();
            }, 0);
          }
          return nextStep;
        });
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
          'priority',
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

  const onSubmit: SubmitHandler<TaskSchemaType> = async (
    data: TaskSchemaType
  ) => {
    try {
      // Map camelCase keys from form to snake_case for DB
      const payload = {
        property_id: data.property_id,
        team_member_id: data.team_member_id,
        assigner_id: data.assigner_id,
        scheduled_date: data.scheduled_date,
        notes: data.notes,
        type: data.type,
        priority: data.priority,
        status: 'pending',
        subtasks: data.subtasks,
        booking_id: bookingId,
      };

      const response = await createTaskAction(payload);

      if (response.status === 201) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        form.reset();

        if (user?.app_metadata.role === 'admin') {
          // setCurrentStep(1);

          toast.success('Task added successfully');
          form.setValue('assigner_id', user?.id);
          router.refresh();
        }
        setOpen(false);
        setCurrentStep(1);
      } else {
        toast.error('Failed to add task');
      }
    } catch (error) {
      console.log('Error adding task: ', error);
      toast.error('An error occurred while adding task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant='outline' className='w-full max-w-xs'>
            <PlusIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
            Create Task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          {/* <DialogDescription>
            Create a new task for your team.
          </DialogDescription> */}
          
          {bookingId && guestName && propertyTitle && (
            <div className="mt-2 flex items-center gap-3 rounded-md bg-muted/50 p-2 text-xs border border-muted-foreground/10">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{guestName}</span>
              </div>
              <div className="h-3 w-[1px] bg-border" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Home className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{propertyTitle}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className='py-2'>
          {/* Step indicator */}
          <div className='flex items-center justify-center mb-2'>
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
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Step 1: Basic Task Information */}
            {currentStep === 1 && (
              <StepOne
                form={form}
                properties={properties}
                taskMembers={taskMembers}
                taskPriorities={taskPriorities}
                bookingId={bookingId}
              />
            )}

            {/* Step 2: Additional Information */}
            {currentStep === 2 && (
              <>
                <StepTwo form={form} ref={stepTwoRef} />
              </>
            )}
            <div className='flex justify-between space-x-2'>
              {currentStep > 1 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={prevStep}
                  className='flex items-center'
                  // disabled={isLoading}
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>
              )}

              <div className='flex-1'></div>

              <DialogClose asChild>
                <Button
                  variant='outline'
                  type='button'
                  // disabled={isLoading}
                >
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
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Adding...' : 'Add Task'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
