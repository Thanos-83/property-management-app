'use client';

import { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CurrentUserDisplayInfo,
  TableTask,
  TaskPrioritiesOption,
  TaskStatusOption,
} from '@/types/taskTypes';
import { deleteTaskByIdAction } from '@/lib/actions/taskActions';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { toast } from 'sonner';

// Import our newly split components
import { getColumns } from './TaskTableColumns';
import TaskTableFilters from './TaskTableFilters';
import TaskTablePagination from './TaskTablePagination';
import { TaskDetailsSheet } from '../calendar/TaskDetailsSheet';
import { Property } from '@/types/propertyTypes';

export interface TeamMember {
  id: string;
  name: string;
}

export default function TasksTable({
  tableTasks,
  taskStatuses,
  taskPriorities,
  properties,
  members,
  currentUserId,
  currentUserInfo,
}: {
  tableTasks: TableTask[];
  taskStatuses: TaskStatusOption[];
  taskPriorities: TaskPrioritiesOption[];
  properties: Property[];
  members: TeamMember[];
  currentUserId: string;
  currentUserInfo: CurrentUserDisplayInfo;
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate the columns dynamically using useMemo so it doesn't re-render constantly
  const serializedStatuses = JSON.stringify(taskStatuses);
  const columns = useMemo(() => getColumns(taskStatuses), [serializedStatuses]);

  // State for the Task Details Sheet
  const [selectedTask, setSelectedTask] = useState<TableTask | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const table = useReactTable({
    data: tableTasks,
    columns,
    getRowId: (row) => row.id,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDeleteRows = async (rowsData: Row<TableTask>[]) => {
    setIsDeleting(true);
    const taskIds = rowsData.map((row) => row.original.id);
    try {
      for (const id of taskIds) {
        await deleteTaskByIdAction(id);
      }
      table.toggleAllRowsSelected(false);
      toast.success(`${taskIds.length} tasks deleted successfully`);
    } catch (error) {
      console.log('Error deleting tasks: ', error);
      toast.error('Failed to delete selected tasks');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRowClick = (task: TableTask) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  return (
    <div className='space-y-4'>
      <TaskTableFilters
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onDeleteRows={handleDeleteRows}
        isDeleting={isDeleting}
        properties={properties}
        // taskStatuses={taskStatuses}
        // taskPriorities={taskPriorities}
      />

      <div className='overflow-hidden rounded-sm border border-border bg-background shadow-sm'>
        <Table className='table-fixed'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='border-border hover:bg-transparent'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className='h-11 font-semibold text-foreground bg-muted/50'>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          header.column.getCanSort() &&
                            'flex h-full cursor-pointer items-center justify-between gap-2 select-none',
                        )}
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: (
                            <ChevronUpIcon className='opacity-60' size={16} />
                          ),
                          desc: (
                            <ChevronDownIcon className='opacity-60' size={16} />
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='border-border cursor-pointer hover:bg-muted/30 transition-colors group'
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => handleRowClick(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='py-3'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-32 text-center text-muted-foreground'>
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskTablePagination table={table} />

      {/* --- TASK DETAILS SHEET --- */}
      <TaskDetailsSheet
        task={selectedTask}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        mode='edit'
        taskPriorities={taskPriorities}
        taskStatus={taskStatuses}
        properties={properties}
        teamMembers={members}
        currentUserId={currentUserId}
        currentUserInfo={currentUserInfo}
        currentDate={new Date()}
      />
    </div>
  );
}
