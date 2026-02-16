import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { CreateTemplateForm } from "@/components/task-templates/CreateTemplateForm";
import { fetchTaskPrioritiesAction } from "@/lib/actions/taskActions";
import { getTaskMembersAction } from "@/lib/actions/taskMemberActions";
import { getPropertiesDataAction } from "@/lib/actions/propertiesActions";

export default async function NewTemplatePage() {

    const [prioritiesResult, membersResult, propertiesResult] = await Promise.all([
        fetchTaskPrioritiesAction(),
        getTaskMembersAction(),
        getPropertiesDataAction()
    ]);

    const priorities = prioritiesResult.data || [];
    const teamMembers = membersResult.members || [];
    const properties = propertiesResult.properties || [];

    // console.log('priorities: ',priorities);
    // console.log('teamMembers: ',teamMembers);
    // console.log('properties: ',properties);

    // Transform data for the form
    const formattedPriorities = priorities.map((priority: any) => ({
        id: priority.id,
        name: priority.priority,
        color: priority.priority_color
    }));

    const formattedMembers = teamMembers.map((member: any) => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name
    }));

    const formattedProperties = properties.map((property: any) => ({
        id: property.id,
        title: property.title
    }));


    return (
        <div className='overflow-y-auto p-4 md:p-8 space-y-6'>
            <div className="flex items-center gap-4">
                 <Link href="/dashboard/task-templates" className="text-md text-muted-foreground hover:text-primary flex items-center"> 
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Task Templates
                </Link>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Create Task Template</h1>
                <p className="text-muted-foreground">
                    Define a reusable task workflow that can be automated for specific properties.
                </p>
            </div>

            <CreateTemplateForm 
                teamMembers={formattedMembers} 
                properties={formattedProperties}
                priorities={formattedPriorities} 
            />
        </div>
    )
}