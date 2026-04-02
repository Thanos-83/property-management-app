import { getInboxConversations } from '@/lib/actions/communicationHubActions';
import LeftPane from '@/components/chat/LeftPane';
import { Conversation } from '@/types/chatTypes';
import Timeline from '@/components/chat/Timeline';
import RightPane from '@/components/chat/RightPane';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  // 1. Fetch the grouped conversations on the server
  const response = await getInboxConversations();
  const conversations: Conversation[] = response.success ? response.data : [];

  //   console.log('Conversations:', response);

  return (
    // The main container: full height, hidden overflow to allow inner scrolling
    <div className='flex h-[calc(100dvh-4rem)] bg-white overflow-hidden'>
      {/* LEFT PANE: The Conversation List
        Takes up a fixed width on desktop, full width on mobile if no chat is selected 
      */}
      <div className='w-full md:w-80 lg:w-96 flex flex-col bg-gray-50/50'>
        <LeftPane initialConversations={conversations} />
      </div>

      {/* MIDDLE PANE: The Unified Timeline (Placeholder)
        Takes up the remaining flexible space
      */}
      <div className='flex-1 flex flex-col relative border-l border-r border-border overflow-hidden'>
        <Timeline />
      </div>

      {/* RIGHT PANE: Booking Context Sidebar (Placeholder)
        Hidden on smaller screens, standard width on large screens.
        (We will convert this to a Slide Sheet for mobile later as you requested!)
      */}
      <div className='hidden xl:block w-96 bg-gray-50'>
        <RightPane />
      </div>
    </div>
  );
}
