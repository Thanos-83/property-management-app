'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList } from 'lucide-react';
import TaskTemplateCard from './TaskTemplateCard';
import { TaskTemplateSheet } from './TaskTemplateSheet';
import {
  TaskTemplateProperty,
  TaskTemplateTeamMember,
  TaskTemplatePriority,
  TaskTemplateTaskType,
  TaskTemplate,
} from '@/types/taskTemplatesTypes';

interface TaskTemplatesClientProps {
  initialTemplates: TaskTemplate[];
  properties: TaskTemplateProperty[];
  teamMembers: TaskTemplateTeamMember[];
  priorities: TaskTemplatePriority[];
  taskTypes: TaskTemplateTaskType[];
  canAdd: boolean;
  reason: string;
  currentTier: string;
}

export default function TaskTemplatesClient({
  initialTemplates,
  properties,
  teamMembers,
  priorities,
  taskTypes,
  canAdd,
  reason,
  currentTier,
}: TaskTemplatesClientProps) {
  // --- Slide Sheet State ---
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');

  console.log('Initial template:', initialTemplates);
  console.log('Properties:', properties);
  console.log('Team members:', teamMembers);
  console.log('Priorities:', priorities);
  console.log('Task types:', taskTypes);
  console.log('Can add:', canAdd);
  console.log('Reason:', reason);
  console.log('Current Tier:', currentTier);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setSheetMode('create');
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setSheetMode('edit');
    setIsSheetOpen(true);
  };

  return (
    <div className='flex-1 overflow-y-auto bg-slate-50/50 min-h-screen'>
      {/* --- HEADER --- */}
      <div className='bg-white border-b border-border shadow-sm'>
        <div className='p-6 max-w-[1600px] mx-auto flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Task Templates
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage the automated recipes that generate tasks for your
              properties.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className='font-bold shadow-sm'>
            <Plus className='w-4 h-4 mr-2' /> Add Template
          </Button>
        </div>
      </div>

      {/* --- MAIN CONTENT (GRID) --- */}
      <div className='p-6 max-w-[1600px] mx-auto pb-24'>
        {initialTemplates.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-white/50 text-center mt-8'>
            <div className='bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4'>
              <ClipboardList className='w-6 h-6 text-muted-foreground' />
            </div>
            <p className='text-lg font-bold text-foreground mb-1'>
              No templates found
            </p>
            <p className='text-sm text-muted-foreground mb-4'>
              Create your first task template to start automating your workflow.
            </p>
            <Button
              onClick={handleOpenCreate}
              variant='outline'
              className='font-semibold'>
              <Plus className='w-4 h-4 mr-2' /> Create Template
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {initialTemplates.map((template: TaskTemplate) => (
              <TaskTemplateCard
                key={template.id}
                template={template}
                onManageTemplateSheetOpen={() => handleOpenEdit(template)} // Pass the handler down
              />
            ))}
          </div>
        )}
      </div>

      {/* --- THE SLIDE SHEET --- */}
      <TaskTemplateSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        template={selectedTemplate}
        mode={sheetMode}
        properties={properties}
        teamMembers={teamMembers}
        priorities={priorities}
        taskTypes={taskTypes}
        canAdd={canAdd}
        reason={reason}
        currentTier={currentTier}
      />
    </div>
  );
}
