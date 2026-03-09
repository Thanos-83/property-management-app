'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Sparkles, 
  Wrench, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Home, 
  CheckSquare, 
  User,
  Flag,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { capitalizeFirstLetter } from "@/lib/heplers";
import { DeleteTaskTemplateAlertDialog } from "./DeleteTaskTemplateAlertDialog";
import { useState } from "react";
import { toast } from "sonner";
import { deleteTaskTemplateAction } from "@/lib/actions/taskTemplateActions";
import { useRouter } from "next/navigation";

interface TaskTemplateCardProps {
  template: any;
  onManageTemplateSheetOpen:(open: boolean)=>void
}



export default function TaskTemplateCard({ template, onManageTemplateSheetOpen }: TaskTemplateCardProps) {
  const isCleaning = template.task_type === 'Cleaning';

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteTaskTemplateAction(template.id);
      if (response.success) {
        toast.success('Template deleted successfully!');
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error('Error deleting template');
    } finally {
      router.refresh();
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  return (
    <div className={`group flex flex-col bg-white rounded-md border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative ${isDeleting ? 'animate-pulse' : ''}`}>
      
      {/* CARD HEADER */}
      <div className="p-4 h-[110px] border-b border-border/50 bg-muted/10 flex flex-col gap-3">
        
        {/* Top Row: Type & Status + Options */}
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              {template.task_type}
            </span>
            <Badge variant={template.is_active ? "secondary" : "outline"} className={`text-[9px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider shadow-sm rounded-md ${template.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'text-muted-foreground'}`}>
              {template.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* MORE OPTIONS DROPDOWN */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 text-muted-foreground shrink-0 rounded-md hover:bg-muted">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px] rounded-md">
              <DropdownMenuItem asChild className="cursor-pointer font-medium">
                <Link href={`/dashboard/task-templates/${template.id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) =>{
                e.stopPropagation();
                setIsDropdownOpen(false);
                setIsDeleteDialogOpen(true);
              } } className="cursor-pointer text-destructive font-medium focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Row: Icon + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-md border shadow-sm shrink-0 ${
            isCleaning 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-chart-2/10 text-chart-2 border-chart-2/20'
          }`}>
            {isCleaning ? <Sparkles className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
          </div>
          <h2 className="font-extrabold text-foreground line-clamp-2 leading-tight text-base" title={template.name}>
            {template.name}
          </h2>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[32px]">
          {template.description_notes || "No description provided."}
        </p>

        {/* ENRICHED DATA DENSITY */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground mb-5 mt-auto">
          <div className="w-1/2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> 
            <span className="flex-1 truncate" title={template.default_team_member_id ? `${template.team_member.first_name + ' ' + template.team_member.last_name}` : "Unassigned"}>
              {template.default_team_member_id ? `${template.team_member.first_name + ' ' + template.team_member.last_name}` : 'Unassigned'}
            </span>
          </div>
          <div className="w-1/2 flex items-center gap-1.5">
              {template.priority?.priority ? (
                <>
                  <Flag 
                    className="w-3.5 h-3.5" 
                    style={{ color: template.priority.priority_color }} 
                  /> 
                  <span 
                    className="flex-1 truncate" 
                    style={{ color: template.priority.priority_color }}
                    title={template.priority.priority}
                  >
                    {capitalizeFirstLetter(template.priority.priority)}
                  </span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span 
                    className="flex-1 truncate text-muted-foreground" 
                    title="Standard Priority"
                  >
                    Standard
                  </span>
                </>
              )}
            </div>
        </div>
        
        {/* OPERATIONAL METRICS */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 p-2.5 bg-muted/30 rounded-md border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Home className="w-3 h-3 shrink-0" /> Automates
            </span>
            <span className="text-sm font-black text-foreground">
              {template.propertiesCount} <span className="text-[11px] font-medium text-muted-foreground ml-0.5">Properties</span>
            </span>
          </div>
          
          <div className="flex flex-col gap-1 p-2.5 bg-muted/30 rounded-md border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <CheckSquare className="w-3 h-3 shrink-0" /> Checklist
            </span>
            <span className="text-sm font-black text-foreground">
              {template.checklistCount} <span className="text-[11px] font-medium text-muted-foreground ml-0.5">Items</span>
            </span>
          </div>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div className="px-5 py-3 border-t border-border bg-muted/5 flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3 h-3 opacity-70" />
          {template.created_at ? new Date(template.created_at).toLocaleDateString('el-GR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
        </span>
        <Button onClick={()=>onManageTemplateSheetOpen(true)} size="sm" variant="default" className="h-8 px-4 text-xs font-bold rounded-md shadow-sm">
          {/* <Link href={`/dashboard/task-templates/${template.id}/edit`}> */}
            <Edit2 className="w-3 h-3 mr-1.5" /> Edit
          {/* </Link> */}
        </Button>
      </div>
      <DeleteTaskTemplateAlertDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
      />
    </div>
  );
}