'use client';

import React, { useCallback, useState } from 'react';
import { X, UploadCloud, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export interface TaskAttachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
}

interface TaskAttachmentZoneProps {
  existingAttachments?: TaskAttachment[];
  newFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveNewFile: (index: number) => void;
  onRemoveExisting?: (attachmentId: string) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export function TaskAttachmentZone({
  existingAttachments = [],
  newFiles = [],
  onFilesSelected,
  onRemoveNewFile,
  onRemoveExisting,
  disabled = false,
  isSubmitting = false
}: TaskAttachmentZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. THE DROP ZONE */}
      <div 
        className={`
          relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        {/* --- UPDATED: accept attribute allows Images, PDFs, and Word Docs --- */}
        <input 
          id="file-upload" 
          type="file" 
          multiple 
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
          className="hidden" 
          onChange={handleFileInput}
          disabled={disabled}
        />
        <div className="p-3 bg-background rounded-full shadow-sm mb-3 border border-border">
          <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Click or drag files here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports Images, PDF & Word Docs (Max 5MB)
        </p>
      </div>

      {/* 2. PREVIEWS GRID */}
      {(existingAttachments.length > 0 || newFiles.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          
          {/* Render Existing (Database) Images/Files */}
          {existingAttachments.map((attachment) => (
            <div key={attachment.id} className="relative group rounded-md overflow-hidden border border-border bg-muted aspect-square">
              {attachment.file_type?.startsWith('image/') ? (
                <Link href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                <Image 
                  src={attachment.file_url} 
                  alt={attachment.file_name}
                  fill
                  className="object-cover"
                  title={attachment.file_name}
                />
                </Link>
              ) : (
                <Link href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-full text-muted-foreground p-2 text-center bg-card">
                  <FileText className="w-8 h-8 mb-2 opacity-50 text-primary" />
                  <span className="text-[10px] truncate w-full px-1" title={attachment.file_name}>
                    {attachment.file_name}
                  </span>
                </Link>
              )}
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExisting(attachment.id);
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Render New (Pending Upload) Files using object URLs */}
          {newFiles.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const objectUrl = isImage ? URL.createObjectURL(file) : null;
            
            return (
              <div key={`new-${index}`} className="relative group rounded-md overflow-hidden border border-primary/30 ring-1 ring-primary/20 bg-primary/5 aspect-square">
                {isImage && objectUrl ? (
                   <Image 
                     src={objectUrl} 
                     alt={file.name}
                     fill
                     className="object-cover opacity-80"
                   />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-primary p-2 text-center bg-card/50">
                    <FileText className="w-8 h-8 mb-2 opacity-70" />
                    <span className="text-[10px] truncate w-full px-1" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                )} 
                
                {/* Pending Upload Indicator */}
                <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold text-center py-0.5 flex items-center justify-center gap-1">
                  Pending...
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveNewFile(index);
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}