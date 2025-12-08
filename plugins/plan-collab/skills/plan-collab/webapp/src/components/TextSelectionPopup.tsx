import { useState, useEffect, useRef } from "react";
import { MessageSquarePlus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextSelectionPopupProps {
  selectedText: string;
  position: { x: number; y: number };
  anchorPrefix?: string;
  anchorSuffix?: string;
  onAddComment: (data: { text: string; comment: string; anchorPrefix?: string; anchorSuffix?: string }) => void;
  onClose: () => void;
}

export function TextSelectionPopup({
  selectedText,
  position,
  anchorPrefix,
  anchorSuffix,
  onAddComment,
  onClose,
}: TextSelectionPopupProps) {
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onAddComment({
      text: selectedText,
      comment: comment.trim(),
      anchorPrefix,
      anchorSuffix,
    });
  };

  const isValid = comment.trim();

  // Adjust position to keep popup in viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: position.y + 10,
  };

  return (
    <div
      ref={popupRef}
      className={cn(
        "fixed z-50 animate-scale-in",
        "bg-panel border border-border rounded-xl shadow-xl",
        showForm ? "w-80" : "w-auto"
      )}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {!showForm ? (
        /* Initial tooltip with "Add Comment" button */
        <div className="p-2 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Add Comment
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        /* Expanded comment form */
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <MessageSquarePlus className="w-4 h-4 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Add Comment</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected text preview */}
          <div className="p-3 rounded-lg bg-highlight/40 border-l-3 border-accent">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Selected text
            </p>
            <p className="text-sm text-foreground/80 italic line-clamp-3">
              "{selectedText}"
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Comment */}
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comment..."
              rows={3}
              className="resize-none text-sm bg-background border-border"
              autoFocus
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!isValid}
                className={cn(
                  "flex-1 gap-2",
                  isValid
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
                className="border-border"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
