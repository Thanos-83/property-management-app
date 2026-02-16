import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTaskTemplatesAction } from "@/lib/actions/taskTemplateActions";

export default async function TaskTemplatesPage() {

  const templates = await getTaskTemplatesAction();

      return (
        <div className='group flex-1 overflow-y-auto p-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold mb-4'>Tasks</h1>
            <Button variant="outline"><Link href="/dashboard/task-templates/new-template">Add Template</Link></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {templates.map((template: any) => (
              <div key={template.id} className="space-y-2 p-4 border border-border rounded-md">
                <h2 className="text-lg font-semibold">{template.name}</h2>
                <p className="text-muted-foreground">{template.description_notes}</p>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">{template.task_type}</p>
                  <Link href={`/dashboard/task-templates/${template.id}`} className="text-primary hover:underline">View</Link>
                  <Link href={`/dashboard/task-templates/${template.id}/edit`} className="text-primary hover:underline">Edit</Link>
                  <Link href={`/dashboard/task-templates/${template.id}/delete`} className="text-primary hover:underline">Delete</Link>
                </div>
              </div>
            ))}
          </div>          
        </div>
      );
    }
