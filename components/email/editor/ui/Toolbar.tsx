'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection, 
  $isRootOrShadowRoot,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { 
  $isListNode, 
  ListNode, 
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $isHeadingNode } from "@lexical/rich-text";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Undo2, 
  Redo2,
  List as ListIcon,
  ListOrdered,
  Quote,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const blockTypeToBlockName = {
  paragraph: { label: 'Paragraph', icon: <Pilcrow className="h-4 w-4" /> },
  h1: { label: 'Heading 1', icon: <Heading1 className="h-4 w-4" /> },
  h2: { label: 'Heading 2', icon: <Heading2 className="h-4 w-4" /> },
  h3: { label: 'Heading 3', icon: <Heading3 className="h-4 w-4" /> },
  bullet: { label: 'Bullet List', icon: <ListIcon className="h-4 w-4" /> },
  number: { label: 'Numbered List', icon: <ListOrdered className="h-4 w-4" /> },
  quote: { label: 'Quote', icon: <Quote className="h-4 w-4" /> },
};

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          // Map to known block types
          if (type === 'bullet') setBlockType('bullet');
          else if (type === 'number') setBlockType('number');
          else setBlockType('paragraph'); // Fallback
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          } else {
             // Handle quotes or other types if matches key
             setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }

      // Update Formats
      const formats: string[] = [];
      if (selection.hasFormat('bold')) formats.push('bold');
      if (selection.hasFormat('italic')) formats.push('italic');
      if (selection.hasFormat('underline')) formats.push('underline');
      if (selection.hasFormat('strikethrough')) formats.push('strikethrough');
      
      setActiveFormats(formats);
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  return (
    <div className="vertical-align-middle sticky bottom-0 z-10 flex items-center gap-2 overflow-auto border-b p-1 bg-background bg-green-50 w-full">
      {/* History Group */}
      <div className="flex items-center gap-1">
        <Button
        variant="ghost"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <button
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <Separator orientation="vertical" className="!h-7" />

      {/* Block Format Selector */}
      <Select value={blockType} onValueChange={(value) => {
         if (value === 'paragraph') formatParagraph();
         else if (value === 'h1') formatHeading('h1');
         else if (value === 'h2') formatHeading('h2');
         else if (value === 'h3') formatHeading('h3');
         else if (value === 'bullet') formatBulletList();
         else if (value === 'number') formatNumberedList();
         else if (value === 'quote') formatQuote();
      }}>
        <SelectTrigger className="!h-8 w-[140px] gap-1 shadow-none border-input bg-transparent focus:ring-0">
          <SelectValue placeholder="Block" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(blockTypeToBlockName).map(([key, { label, icon }]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="!h-7" />

      {/* Text Formats */}
      <ToggleGroup 
        type="multiple" 
        value={activeFormats}
        onValueChange={(vals) => {
           // We rely on buttons clicking dispatching commands
        }}
        className="gap-0"
      >
        <ToggleGroupItem 
          value="bold" 
          aria-label="Bold"
          className="!h-8 !w-8 p-0 rounded-none first:rounded-l-md border border-input border-r-0 hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        >
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="italic" 
          aria-label="Italic" 
          className="!h-8 !w-8 p-0 rounded-none border border-input border-r-0 hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        >
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="underline" 
          aria-label="Underline"
          className="!h-8 !w-8 p-0 rounded-none border border-input border-r-0 hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        >
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="strikethrough" 
          aria-label="Strikethrough" 
          className="!h-8 !w-8 p-0 rounded-none last:rounded-r-md border border-input hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="!h-7" />

      {/* Alignment */}
       <ToggleGroup type="single" className="gap-0">
        <ToggleGroupItem 
          value="left" 
          className="!h-8 !w-8 p-0 rounded-none first:rounded-l-md border border-input border-r-0 hover:bg-muted"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
        >
          <AlignLeft className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="center" 
          className="!h-8 !w-8 p-0 rounded-none border border-input border-r-0 hover:bg-muted"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
        >
          <AlignCenter className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="right" 
          className="!h-8 !w-8 p-0 rounded-none last:rounded-r-md border border-input hover:bg-muted"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
        >
          <AlignRight className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

    </div>
  );
}
