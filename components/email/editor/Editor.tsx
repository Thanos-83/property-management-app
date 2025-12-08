'use client';

import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

/* Nodes */
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';

/* Components */
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';

// ... other imports

/* Components */
import { Toolbar } from './ui/Toolbar';
import theme from './theme';

interface EditorProps {
  // We can expose props for initial content later
  placeholder?: string;
  className?: string;
  onChange?: (html: string) => void;
}

const editorConfig: any = {
  namespace: 'ShadcnEditor',
  theme,
  onError: (error: Error) => {
    console.error(error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    CodeNode,
    CodeHighlightNode,
  ],
  editorState: null,
  immediatelyRender: false, // Important for hydration
};

export function Editor({ placeholder = 'Write something...', className, onChange }: EditorProps) {
  return (
    <div className={`relative flex flex-col border rounded-lg shadow-sm bg-background overflow-hidden ${className}`}>
      <LexicalComposer initialConfig={editorConfig}>
        <div className='bg-gray-50'>
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="ContentEditable__root relative block min-h-[300px] overflow-auto px-8 py-4 focus:outline-none" 
              />
            }
            placeholder={
              <div className="absolute top-4 left-8 text-muted-foreground pointer-events-none select-none text-sm">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <Toolbar />
        </div>
        {/* Essential Plugins */}
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(editor, null);
              if (onChange) {
                onChange(html);
              }
            });
          }}
        />
        {/* We can add AutoFocus, etc. later */}
      </LexicalComposer>
    </div>
  );
}
