'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskSchemaType } from '@/lib/schemas/task';
import {
  addTaskAction,
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

type Property = {
  id: string;
  title: string;
};

type TaskMember = {
  id: string;
  name: string;
};

type TaskPriorities = {
  id: number;
  created_at: string;
  priority: string;
  priority_color: string;
};

export default function AddTaskModal() {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<TaskPriorities[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const stepTwoRef = React.useRef<StepTwoRef>(null);

  const defaultValues: TaskSchemaType = {
    type: '',
    scheduled_date: '',
    notes: '',
    team_member_id: null,
    property_id: '',
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

    // console.log('Iam here 1');
    async function fetchTaskPriorities() {
      const response = await fetchTaskPrioritiesAction();

      // console.log('Iam here 2');

      if (!response.error && response.data) {
        setTaskPriorities(response.data);
      } else {
        toast.error('Failed to fetch task priorities');
      }
    }

    fetchTaskPriorities();
    // console.log('Iam here 3');

    return () => {
      fetchUserData();
      fetchProperties();
      fetchTaskMembers();
      fetchTaskPriorities();
    };
  }, [form]);

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
      };

      const response = await addTaskAction(payload);

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
      <DialogTrigger asChild>
        <Button variant='outline'>
          <PlusIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <VisuallyHidden asChild>
            <DialogTitle>Add New Task</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden asChild>
            <DialogDescription>Add task info</DialogDescription>
          </VisuallyHidden>
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
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Step 1: Basic Task Information */}
            {currentStep === 1 && (
              <StepOne
                form={form}
                properties={properties}
                taskMembers={taskMembers}
                taskPriorities={taskPriorities}
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
