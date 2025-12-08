'use client';

import * as React from 'react';
import { X, Mic, Paperclip, Send, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Editor } from './editor/Editor';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}

export function ComposeEmailDialog({ open, onOpenChange, accountId }: ComposeEmailDialogProps) {
    const [to, setTo] = React.useState<string[]>([]);
    const [cc, setCc] = React.useState<string[]>([]);
    const [bcc, setBcc] = React.useState<string[]>([]);
    
    // UI state
    const [showCc, setShowCc] = React.useState(false);
    const [showBcc, setShowBcc] = React.useState(false);
    
    const [subject, setSubject] = React.useState('');
    const [htmlBody, setHtmlBody] = React.useState('');
    const [sending, setSending] = React.useState(false);
    
    // Tag Input Helper
    const TagInput = ({ 
        tags, 
        setTags, 
        placeholder 
    }: { 
        tags: string[], 
        setTags: (t: string[]) => void, 
        placeholder?: string 
    }) => {
        const [inputValue, setInputValue] = React.useState('');

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const trimmed = inputValue.trim();
                // Simple email validation regex or logic could go here
                if (trimmed && !tags.includes(trimmed)) {
                    setTags([...tags, trimmed]);
                    setInputValue('');
                }
            } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
                setTags(tags.slice(0, -1));
            }
        };

        return (
             <div className="flex flex-wrap items-center gap-1 flex-1 min-w-[200px]">
                {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="h-6 gap-1 font-normal">
                        {tag}
                        <button
                            type="button"
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => setTags(tags.filter((_, index) => index !== i))}
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
                <input
                    className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm min-w-[120px] h-6"
                    placeholder={tags.length === 0 ? placeholder : ''}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
        )
    };

    const handleSend = async () => {
        if (to.length === 0 || !subject) {
          toast.error('Please add at least one recipient and a subject');
          return;
        }
    
        setSending(true);
    
        try {
          const response = await fetch('/api/emails/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId,
              to: to,
              cc: cc.length > 0 ? cc : undefined,
              bcc: bcc.length > 0 ? bcc : undefined,
              subject,
              body: htmlBody,
            }),
          });
    
          const result = await response.json();
    
          if (!response.ok) {
            throw new Error(result.error || 'Failed to send email');
          }
    
          toast.success('Email sent successfully!');
          onOpenChange(false);
          
          // Reset form
          setTo([]);
          setCc([]);
          setBcc([]);
          setSubject('');
          setHtmlBody('');
          setShowCc(false);
          setShowBcc(false);
    
        } catch (error: any) {
          console.error('Send error:', error);
          toast.error(error.message || 'Failed to send email');
        } finally {
          setSending(false);
        }
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden h-[80vh] flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-medium">New Message</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-auto">
             {/* Recipients Area */}
            <div className="px-4 py-2 space-y-2 border-b">
                 {/* To Row */}
                <div className="flex items-start gap-2 pt-1 border-b pb-1">
                    <span className="text-sm font-medium text-muted-foreground w-12 mt-1">To</span>
                    <div className="flex-1 flex flex-wrap gap-2">
                        <TagInput tags={to} setTags={setTo} placeholder="Recipients" />
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                        {!showCc && <button onClick={() => setShowCc(true)} className="hover:text-foreground px-2">Cc</button>}
                        {!showBcc && <button onClick={() => setShowBcc(true)} className="hover:text-foreground px-2">Bcc</button>}
                    </div>
                </div>

                 {/* Cc Row */}
                {showCc && (
                    <div className="flex items-start gap-2 pt-1 border-b pb-1">
                        <span className="text-sm font-medium text-muted-foreground w-12 mt-1">Cc</span>
                        <div className="flex-1">
                             <TagInput tags={cc} setTags={setCc} />
                        </div>
                    </div>
                )}

                 {/* Bcc Row */}
                {showBcc && (
                    <div className="flex items-start gap-2 pt-1 border-b pb-1">
                         <span className="text-sm font-medium text-muted-foreground w-12 mt-1">Bcc</span>
                        <div className="flex-1">
                             <TagInput tags={bcc} setTags={setBcc} />
                        </div>
                    </div>
                )}
            
            
            {/* Subject */}
            <div className="py-2">
                 <Input 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject" 
                    className="border-none shadow-none focus-visible:ring-0 px-0 text-1xl font-bold placeholder:font-semibold h-auto"
                 />
            </div>
            </div>
            
            {/* Editor Container */}
             <div className="flex-1 p-0 relative min-h-[300px] bg-background">
                 <Editor 
                    className="h-full border-none shadow-none rounded-none"
                    placeholder="Draft your email..."
                    onChange={setHtmlBody}
                 />
             </div>
        </div>

         {/* Footer */}
        <div className="p-3 border-t bg-background flex items-center justify-between sticky bottom-0 z-20">
             <div className="flex items-center gap-2">
                 <Button 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                    onClick={handleSend}
                    disabled={sending}
                 >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? 'Sending...' : 'Send'}
                 </Button>
                 
                 <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Paperclip className="h-5 w-5" />
                 </Button>
             </div>
             
             <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Mic className="h-5 w-5" />
                 </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Trash2 className="h-5 w-5" />
                 </Button>
             </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
