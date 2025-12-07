'use client';

import { useState, useCallback } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { CommentPopover } from './CommentPopover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SelectionData, Comment, PlanVersion } from '@/types';

interface PlanViewerProps {
  planId: string;
  version: PlanVersion;
  comments: Comment[];
  onAddComment: (data: {
    anchorText: string;
    anchorPrefix: string;
    anchorSuffix: string;
    startOffset: number;
    endOffset: number;
    content: string;
  }) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
}

export function PlanViewer({
  planId,
  version,
  comments,
  onAddComment,
  onResolveComment
}: PlanViewerProps) {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectionEnd = useCallback(
    (selectionData: SelectionData, rect: DOMRect) => {
      setSelection(selectionData);
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom
      });
    },
    []
  );

  const handleAddComment = async (content: string) => {
    if (!selection) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        anchorText: selection.text,
        anchorPrefix: selection.prefix,
        anchorSuffix: selection.suffix,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        content
      });

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      setPopoverPosition(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setPopoverPosition(null);
  };

  const openComments = comments.filter((c) => c.status === 'OPEN');

  return (
    <div className="relative">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">
            {version.title || 'Implementation Plan'}
          </h1>
          <Badge variant="outline">v{version.version}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {openComments.length > 0 && (
            <Badge variant="secondary">
              {openComments.length} comment{openComments.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Comments sidebar */}
      {openComments.length > 0 && (
        <div className="fixed right-4 top-20 w-72 max-h-[calc(100vh-6rem)] overflow-y-auto bg-background border rounded-lg shadow-lg p-4 z-20">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4"
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
            Comments
          </h3>
          <div className="space-y-3">
            {openComments.map((comment) => (
              <div
                key={comment.id}
                className="border rounded p-3 text-sm space-y-2"
              >
                <p className="text-muted-foreground text-xs line-clamp-2 bg-muted p-1 rounded">
                  &ldquo;{comment.anchor_text}&rdquo;
                </p>
                <p>{comment.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onResolveComment(comment.id)}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan content */}
      <div className={`p-6 ${openComments.length > 0 ? 'pr-80' : ''}`}>
        <SelectionOverlay onSelectionEnd={handleSelectionEnd}>
          <MarkdownRenderer content={version.content} comments={comments} />
        </SelectionOverlay>
      </div>

      {/* Comment popover */}
      {popoverPosition && selection && (
        <CommentPopover
          position={popoverPosition}
          selectedText={selection.text}
          onSubmit={handleAddComment}
          onCancel={handleCancel}
        />
      )}

      {/* Instructions */}
      <div className="fixed bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded border">
        Select text to add a comment
      </div>
    </div>
  );
}
