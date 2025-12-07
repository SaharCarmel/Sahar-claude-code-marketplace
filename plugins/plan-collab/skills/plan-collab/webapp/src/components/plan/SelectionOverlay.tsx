'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { SelectionData } from '@/types';

interface SelectionOverlayProps {
  children: React.ReactNode;
  onSelectionEnd: (selection: SelectionData, rect: DOMRect) => void;
  minSelectionLength?: number;
}

export function SelectionOverlay({
  children,
  onSelectionEnd,
  minSelectionLength = 3
}: SelectionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setIsSelecting(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < minSelectionLength) {
      setIsSelecting(false);
      return;
    }

    // Check if selection is within our container
    const range = selection.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setIsSelecting(false);
      return;
    }

    // Get full text content for offset calculation
    const fullText = containerRef.current.textContent || '';

    // Calculate offsets
    const preRange = document.createRange();
    preRange.setStart(containerRef.current, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + text.length;

    // Get context (prefix and suffix)
    const prefix = fullText.slice(Math.max(0, startOffset - 50), startOffset);
    const suffix = fullText.slice(endOffset, endOffset + 50);

    // Get bounding rect for popup positioning
    const rect = range.getBoundingClientRect();

    setIsSelecting(false);

    onSelectionEnd(
      {
        text,
        prefix,
        suffix,
        startOffset,
        endOffset
      },
      rect
    );
  }, [onSelectionEnd, minSelectionLength]);

  const handleMouseDown = useCallback(() => {
    setIsSelecting(true);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  return (
    <div
      ref={containerRef}
      className={`selection-container ${isSelecting ? 'selecting' : ''}`}
    >
      {children}
    </div>
  );
}
