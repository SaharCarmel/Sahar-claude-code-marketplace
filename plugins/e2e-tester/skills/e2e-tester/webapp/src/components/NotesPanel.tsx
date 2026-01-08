'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Image, X, Clipboard } from 'lucide-react';
import type { Evidence } from '@/lib/types';

interface NotesPanelProps {
  notes: Evidence[];
  sessionId: string;
  testId: string;
  onNoteAdded: (note: Evidence) => void;
}

export function NotesPanel({ notes, sessionId, testId, onNoteAdded }: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Clipboard paste handler - more permissive to capture Mac screenshot paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check if there's an image in clipboard
      let hasImage = false;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          hasImage = true;
          break;
        }
      }

      if (!hasImage) return;

      // Only skip if user is typing in a text input (not our note input)
      const activeElement = document.activeElement;
      const isOurInput = containerRef.current?.contains(activeElement);
      const isTextInput = activeElement?.tagName === 'INPUT' ||
                          activeElement?.tagName === 'TEXTAREA';

      // If user is in a text input that's not ours, let them paste normally
      if (isTextInput && !isOurInput) {
        return;
      }

      // Handle the image paste
      e.preventDefault();
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            await uploadImage(file);
          }
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [sessionId, testId]);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', `Screenshot ${new Date().toLocaleTimeString()}`);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/tests/${testId}/evidence`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newNote = await response.json();
        onNoteAdded(newNote);
        // Close the text input if open (user just wanted to paste image)
        setIsAdding(false);
        setNoteText('');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/tests/${testId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content: noteText,
          label: noteText.slice(0, 30) + (noteText.length > 30 ? '...' : ''),
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        onNoteAdded(newNote);
        setNoteText('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNoteText('');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      await uploadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="mt-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Notes Display - Inline thumbnails and text */}
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {notes.map((note) => (
            <div key={note.id} className="relative group">
              {note.type === 'image' ? (
                // Image thumbnail
                <button
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  className="w-16 h-16 rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                >
                  <img
                    src={note.content}
                    alt={note.label || 'Screenshot'}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                // Text note chip
                <button
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  className="max-w-[200px] px-3 py-1.5 bg-muted rounded-full text-sm truncate hover:bg-muted/80 transition-colors"
                  title={note.content}
                >
                  {note.content.slice(0, 30)}{note.content.length > 30 ? '...' : ''}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded Note View */}
      {expandedNote && (
        <div className="mb-3 p-3 bg-muted rounded-lg relative">
          <button
            onClick={() => setExpandedNote(null)}
            className="absolute top-2 right-2 p-1 hover:bg-background rounded"
          >
            <X className="w-4 h-4" />
          </button>
          {notes.find(n => n.id === expandedNote)?.type === 'image' ? (
            <img
              src={notes.find(n => n.id === expandedNote)?.content}
              alt="Screenshot"
              className="max-w-full max-h-[400px] rounded"
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap pr-6">
              {notes.find(n => n.id === expandedNote)?.content}
            </p>
          )}
        </div>
      )}

      {/* Add Note - Inline Expansion */}
      {isAdding ? (
        <div className="border rounded-lg p-3 bg-background">
          <textarea
            ref={inputRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a note... (Enter to save, Esc to cancel)"
            className="w-full h-20 px-2 py-1 text-sm bg-transparent resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clipboard className="w-3 h-3" />
              <span>Paste image with Cmd+V</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsAdding(false); setNoteText(''); }}
                className="px-3 py-1 text-xs rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Compact Add Buttons
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add note
          </button>

          <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed hover:border-primary hover:text-primary transition-colors cursor-pointer">
            <Image className="w-3 h-3" />
            Screenshot
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = '';
              }}
            />
          </label>

          {isUploading && (
            <span className="text-xs text-muted-foreground">Uploading...</span>
          )}
        </div>
      )}

      {/* Empty State with Paste Hint */}
      {notes.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground mt-2">
          Paste screenshots (Cmd+V) or drag & drop images
        </p>
      )}
    </div>
  );
}
