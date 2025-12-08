import { MessageSquare, X, CheckCircle } from "lucide-react";
import { Comment, HighlightedSection } from "@/data/documents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CommentsPanelProps {
  comments: Comment[];
  highlights: HighlightedSection[];
  activeHighlight: string | null;
  isOpen: boolean;
  onClose: () => void;
  onHighlightSelect: (highlightId: string | null) => void;
  onResolveComment?: (commentId: string) => void;
}

export function CommentsPanel({
  comments,
  highlights,
  activeHighlight,
  isOpen,
  onClose,
  onHighlightSelect,
  onResolveComment,
}: CommentsPanelProps) {
  const getHighlightText = (highlightId: string) => {
    return highlights.find((h) => h.id === highlightId)?.text || "";
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-panel border-l border-border h-screen flex flex-col animate-slide-in-right">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">Comments</h2>
          <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-2">Select text in the plan to add a comment</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              onClick={() => onHighlightSelect(comment.highlightId)}
              className={cn(
                "p-4 rounded-lg cursor-pointer transition-all duration-200 animate-fade-in",
                "bg-comment hover:shadow-md",
                activeHighlight === comment.highlightId && "ring-2 ring-accent shadow-md"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-3 pb-2 border-b border-border/50">
                <p className="text-xs text-accent font-medium uppercase tracking-wide mb-1">
                  Highlighted text
                </p>
                <p className="text-sm text-foreground/80 italic line-clamp-2">
                  "{getHighlightText(comment.highlightId)}"
                </p>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-accent-foreground">
                    {comment.author.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {comment.author}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(comment.timestamp)}
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                {comment.text}
              </p>
              {onResolveComment && (
                <div className="mt-3 pt-3 border-t border-border/50 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolveComment(comment.id);
                    }}
                    className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Mark Resolved
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
