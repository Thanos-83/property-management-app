'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { SingleTask, TaskTodo, TaskPrioritiesOption, TaskStatusOption } from "@/types/taskTypes";
import { taskDetailsSchema, TaskDetailsSchemaType } from "@/lib/schemas/task";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CalendarIcon, CheckSquare, FileText, Flag, Loader2, Plus, Sparkles, User, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { capitalizeFirstLetter } from "@/lib/heplers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableChecklistItem } from "./SortableChecklistItem";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { DeleteTaskAlert } from "./DeleteTaskAlert";
import { toast } from "sonner";
import { deleteTaskByIdAction, updateTaskAction, createTaskAction } from "@/lib/actions/taskActions";

interface TaskDetailsSheetProps {
  task: SingleTask | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  properties: any[];
  teamMembers: any[];
  taskStatus: TaskStatusOption[];
  taskPriorities: TaskPrioritiesOption[];
  currentUserId: string;
  currentDate: Date;
  mode?: 'create' | 'edit';
}

export function TaskDetailsSheet({ 
  task, 
  isOpen, 
  onOpenChange, 
  properties = [], 
  teamMembers = [], 
  taskStatus = [], 
  taskPriorities = [],
  currentUserId,
  currentDate,
  mode = 'edit' // Default to edit so we don't break existing implementations
}: TaskDetailsSheetProps) {

  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const isCreateMode = mode === 'create';

  // 1. INITIALIZE THE FORM
  // We extend the local type to include 'type' just in case it's not in the base zod schema yet
  const form = useForm<TaskDetailsSchemaType & { type?: string }>({
    resolver: zodResolver(taskDetailsSchema),
    defaultValues: {
      taskId: '',
      property_id: '',
      team_member_id: 'unassigned',
      status: '',
      priority: '',
      scheduled_date: currentDate,
      notes: '',
      taskTodos: [],
      type: 'Cleaning' // Default type for new tasks
    },
  });

  console.log('Form errors: ', form.formState.errors);
  // 2. SETUP FIELD ARRAY FOR THE CHECKLIST
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'taskTodos',
  });

  // Setup DnD Sensors
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

  // 3. LOAD DATA INTO THE FORM WHEN OPENED
  useEffect(() => {
    if (!isOpen) return;

    if (isCreateMode) {
      // PREPARE FRESH FORM FOR CREATE MODE
      form.reset({
        taskId: '', // Backend will generate this
        property_id: '', 
        team_member_id: 'unassigned',
        status: taskStatus?.[0]?.status ?? 'pending',
        priority: taskPriorities?.[0]?.id ? String(taskPriorities[0].id) : '',
        scheduled_date: currentDate ? currentDate : new Date(),
        notes: '',
        taskTodos: [],
        type: 'Cleaning'
      });
    } else if (task) {
      // POPULATE EXISTING DATA FOR EDIT MODE
      const matchStatus = taskStatus?.find((s: any) => 
        String(s.id) === String(task?.status) || s.status?.toLowerCase().trim() === task?.status?.toLowerCase().trim()
      );
      const matchPriority = taskPriorities?.find((p: any) => 
        String(p.id) === String(task?.priority) || p.priority?.toLowerCase().trim() === String(task?.priority).toLowerCase().trim()
      );

      form.reset({
        taskId: task.id,
        property_id: task.property_id || '',
        team_member_id: task.team_member_id || 'unassigned',
        status: matchStatus ? String(matchStatus.status).trim() : (task?.status ?? ''),
        priority: matchPriority ? String(matchPriority.id) : (String(task?.priority) ?? ''),
        scheduled_date: task.scheduled_date ? new Date(task.scheduled_date) : new Date(),
        notes: task.notes || '',
        taskTodos: task.taskTodos || [],
        type: task.type || 'Cleaning'
      });
    }
  }, [task, taskStatus, taskPriorities, form, isCreateMode, isOpen]);


  // 4. SUBMIT HANDLER
  const onSubmit: SubmitHandler<TaskDetailsSchemaType & { type?: string }> = async (data) => {
    // If we are in edit mode but somehow have no task, abort.
    if (!isCreateMode && !task) return;

    const formattedTodos = data.taskTodos.map((todo, idx) => ({
        ...todo,
        sort_order: idx + 1
    }));

    const parsedStatus = taskStatus?.find((s: any) => String(s.status).toLowerCase().trim() === String(data.status).toLowerCase().trim());
    
    const payload = {
      ...data,
      taskTodos: formattedTodos,
      team_member_id: data.team_member_id === 'unassigned' ? null : data.team_member_id,
      priority: data.priority,
      status: parsedStatus?.status ?? data.status,
      type: form.getValues('type') || 'Cleaning' // Ensure type is captured for Create mode
    };

    let result;
    if (isCreateMode) {
      result = await createTaskAction(payload);
    } else {
      result = await updateTaskAction(payload);
    }

    if (!result?.error) {
      toast.success(isCreateMode ? "Task created successfully" : "Task updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(isCreateMode ? "Failed to create task" : "Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!task || isCreateMode) return;
    setIsDeleting(true);
    try {
      const result = await deleteTaskByIdAction(task.id); 
      if (!result.error) {
        setIsDeleteDialogOpen(false); 
        onOpenChange(false); 
        router.refresh(); 
        toast.success("Task deleted successfully");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // DYNAMIC HEADER LOOKUPS
  const currentType = form.watch('type') || task?.type || 'Task';
  const isCleaning = currentType === 'Cleaning' || task?.title === 'Cleaning';
  const propertyName = properties?.find(p => p.id === form.watch('property_id'))?.title;
  
  const currentStatusObj = taskStatus?.find((s: TaskStatusOption) => s.status?.toLowerCase().trim() === form.watch('status')?.toLowerCase().trim());
  const currentStatusLabel = currentStatusObj?.status ?? '';
  const currentStatusColor = currentStatusObj?.status_color;

  const currentTodos = form.watch('taskTodos') || [];
  const completedCount = currentTodos.filter((i) => i.is_completed).length;

  // Render a loading state ONLY if we are in Edit Mode and the task hasn't loaded yet.
  if (!isCreateMode && !task && isOpen) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="p-0 flex flex-col w-full sm:max-w-[550px] bg-background border-l border-border">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
             <p className="font-medium">Loading task data...</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 flex flex-col w-full sm:max-w-[550px] bg-background border-l border-border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            
            {/* --- STICKY HEADER --- */}
            <div className="p-4 border-b border-border bg-card shrink-0 shadow-sm relative z-10">
              <SheetHeader className="text-left space-y-0 pr-8">   
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <div className={`p-1.5 rounded-md border shadow-sm ${isCleaning ? 'bg-primary/10 text-primary border-primary/20' : 'bg-chart-2/10 text-chart-2 border-chart-2/20'}`}>
                    {isCleaning ? <Sparkles className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                  </div>
                  
                  <SheetTitle className="text-xl font-black text-foreground">
                    {isCreateMode ? "Create New Task" : capitalizeFirstLetter(currentType)}
                  </SheetTitle>
                  
                  <Badge
                    className="text-[10px] uppercase font-bold tracking-wider shadow-sm border"
                    style={!isCreateMode && currentStatusColor ? {
                      backgroundColor: currentStatusColor + '1a', 
                      color: currentStatusColor,
                      borderColor: currentStatusColor + '33' 
                    } : {}}
                    variant={isCreateMode ? "secondary" : "default"}
                  >
                    {isCreateMode ? "NEW TASK" : currentStatusLabel.replace('_', ' ')}
                  </Badge>
                </div>
                
                <SheetDescription className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {propertyName || (isCreateMode ? "Please select a property below" : "Unknown Property")}
                </SheetDescription>
              </SheetHeader>
            </div>
            
            {/* --- SCROLLABLE BODY --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* WARNING BANNER FOR UNASSIGNED TASKS (Only in Edit mode) */}
              {!isCreateMode && form.watch('team_member_id') === 'unassigned' && 
               !['completed', 'cancelled'].includes(currentStatusLabel?.toLowerCase()?.trim() || '') && (
                <div className="bg-warning/10 border border-warning/20 rounded-md p-4 flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-warning">Task is Unassigned</h4>
                    <p className="text-xs text-warning/80 mt-1 font-medium leading-relaxed">
                      This task currently has no team member assigned to it. Please assign someone to ensure it gets completed.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 1: LOGISTICS (Card Style) */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Task Details & Scheduling
                </h3>

                {/* --- NEW: CREATE MODE ONLY FIELDS --- */}
                {isCreateMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border mb-4">
                    <FormField
                      control={form.control}
                      name="property_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Property <span className="text-destructive">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full bg-white border-border">
                                <SelectValue placeholder="Select Property" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-border">
                              {properties?.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.title}
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Task Type <span className="text-destructive">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full bg-white border-border">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-border">
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
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduled_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Scheduled Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border bg-white", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd-MM-yyyy') : <span>Pick date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-border z-[100]">
                            <Calendar mode="single" defaultMonth={currentDate} selected={field.value} onSelect={field.onChange} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="team_member_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> Assignee
                        </FormLabel>
                        <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={`w-full bg-white border-border ${field.value === 'unassigned' ? 'text-warning font-semibold' : ''}`}>
                              <SelectValue placeholder="Assign team member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-border">
                            <SelectItem value="unassigned" className="text-warning font-medium">Unassigned</SelectItem>
                            {teamMembers?.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => {
                      const selectedStatusObj = taskStatus?.find((s: any) => String(s.status).toLowerCase().trim() === String(field.value).toLowerCase().trim());
                      return (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Task Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger 
                                className="w-full bg-white border-border font-medium"
                                style={selectedStatusObj?.status_color ? { color: selectedStatusObj.status_color } : {}}
                              >
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-border">
                              {taskStatus?.map((status: any) => (
                                <SelectItem 
                                  key={status.id} 
                                  value={String(status.status).trim()}
                                  style={status.status_color ? { color: status.status_color } : {}}
                                >
                                  {capitalizeFirstLetter(status.status?.replace('_', ' '))}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => {
                      const selectedPriorityObj = taskPriorities?.find((p: any) => String(p.id) === String(field.value));
                      return (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flag className="w-3 h-3" /> Priority
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger 
                                className="w-full bg-white border-border font-medium"
                                style={selectedPriorityObj?.priority_color ? { color: selectedPriorityObj.priority_color } : {}}
                              >
                                <SelectValue placeholder="Select Priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-border">
                              {taskPriorities?.map((priority: any) => (
                                <SelectItem 
                                  key={priority.id} 
                                  value={String(priority.id)}
                                  style={priority.priority_color ? { color: priority.priority_color } : {}}
                                >
                                  {capitalizeFirstLetter(priority.priority)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </div>
              </div>

              {/* SECTION 2: THE SORTABLE CHECKLIST */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" /> 
                    Checklist
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${completedCount === fields.length && completedCount > 0 ? 'bg-status-completed/10 text-status-completed' : 'bg-muted text-muted-foreground'}`}>
                    {completedCount} / {fields.length} Done
                  </span>
                </div>
                
                {fields.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-md bg-background">
                    <p className="text-xs text-muted-foreground mb-3">No checklist items for this task.</p>
                  </div>
                ) : (
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
                        <SortableChecklistItem
                          key={field.id}
                          id={field.id}
                          index={index}
                          control={form.control}
                          remove={remove}
                          append={append}
                          setValue={form.setValue}
                          currentUserId={currentUserId|| ''}
                          teamMembers={teamMembers}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full bg-background border-dashed border-border text-muted-foreground hover:text-foreground"
                  onClick={() => append({ 
                    id: crypto.randomUUID(), 
                    description: '', 
                    is_completed: false, 
                    sort_order: fields.length,
                    completed_by_member: null,
                    completed_datetime: null
                  }, { shouldFocus: true })} // Forces auto-focus!
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Item
                </Button>
                <FormField control={form.control} name="taskTodos" render={() => <FormMessage />} />
              </div>

              {/* SECTION 3: INTERNAL NOTES */}
              <div className="bg-white border border-border rounded-sm p-5 shadow-sm space-y-4">
                 <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" /> Internal Notes
                </h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add instructions or context for the team member..." 
                          className="min-h-[100px] bg-white border-border resize-none" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>

            {/* --- STICKY FOOTER --- */}
            <div className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              
              <div className="flex-1">
                {/* Only render the Delete button in Edit mode */}
                {!isCreateMode && (
                  <DeleteTaskAlert
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                  />
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="bg-background border-border hover:bg-muted font-semibold" 
                  onClick={() => onOpenChange(false)}
                  disabled={isDeleting || form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isDeleting || !form.formState.isDirty || form.formState.isSubmitting} 
                  className="font-bold shadow-sm"
                >
                   {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {form.formState.isSubmitting 
                     ? (isCreateMode ? "Creating..." : "Saving...") 
                     : (isCreateMode ? "Create Task" : "Save Changes")}
                </Button>
              </div>
            </div>

        </form>
      </Form>
      </SheetContent>
    </Sheet>
  );
}