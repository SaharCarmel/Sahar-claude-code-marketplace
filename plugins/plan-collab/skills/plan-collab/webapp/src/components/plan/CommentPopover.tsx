'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentPopoverProps {
  position: { x: number; y: number };
  selectedText: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function CommentPopover({
  position,
  selectedText,
  onSubmit,
  onCancel
}: CommentPopoverProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    };

    // Delay adding listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 340),
    y: position.y
  };

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y + 8,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-popover border rounded-lg shadow-lg p-4 w-80">
        <div className="flex items-start gap-2 mb-3">
          <svg
            className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Commenting on:</p>
            <p className="text-sm bg-muted p-2 rounded line-clamp-2 break-words">
              &ldquo;{selectedText}&rdquo;
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onCancel}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add your comment..."
          className="min-h-[80px] resize-none mb-3"
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter to
            submit
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
              Add Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
