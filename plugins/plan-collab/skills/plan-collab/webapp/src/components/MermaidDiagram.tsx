import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  diagramId?: string;
  commentCount?: number;
  onAddComment?: (diagramId: string, comment: string) => void;
}

export function MermaidDiagram({
  chart,
  className,
  diagramId: externalDiagramId,
  commentCount = 0,
  onAddComment,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch zoom state
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);

  // Comment form state
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Generate stable diagram ID from content hash
  const diagramId = useMemo(() => {
    if (externalDiagramId) return externalDiagramId;
    const hash = chart.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    return `diagram-${hash.toString(16)}`;
  }, [chart, externalDiagramId]);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart.trim()) {
        setIsLoading(false);
        return;
      }

      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          fontFamily: "inherit",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError("Failed to render diagram");
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  // Zoom button handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev * 0.8, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Pan handlers (mouse)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);


  // Touch handlers for pinch-to-zoom
  const getTouchDistance = (t1: React.Touch, t2: React.Touch): number => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        setInitialPinchDistance(distance);
        setInitialScale(scale);
      } else if (e.touches.length === 1 && scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      }
    },
    [scale, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance) {
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const newScale = initialScale * (distance / initialPinchDistance);
        setScale(Math.min(Math.max(newScale, 0.5), 3));
      } else if (e.touches.length === 1 && isDragging) {
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      }
    },
    [initialPinchDistance, initialScale, isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDistance(null);
  }, []);

  // Comment submission
  const handleSubmitComment = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (commentText.trim() && onAddComment) {
        onAddComment(diagramId, commentText.trim());
        setCommentText("");
        setShowCommentForm(false);
      }
    },
    [commentText, diagramId, onAddComment]
  );

  // Get cursor class based on state
  const getCursorClass = () => {
    if (isDragging) return "cursor-grabbing";
    if (scale > 1) return "cursor-grab";
    return "cursor-default";
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "my-6 p-6 rounded-xl bg-card border border-border flex items-center justify-center",
          className
        )}
      >
        <div className="text-muted-foreground text-sm">Loading diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive",
          className
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-6 rounded-xl bg-card border border-border overflow-hidden relative",
        "flex items-center justify-center",
        getCursorClass(),
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Comment icon - top right */}
      {onAddComment && (
        <div className="absolute top-3 right-3 z-10">
          <Popover open={showCommentForm} onOpenChange={setShowCommentForm}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "group flex items-center gap-1.5 p-1.5 rounded-md",
                  "bg-background/80 backdrop-blur-sm border border-border/50",
                  "hover:bg-accent hover:border-accent transition-all duration-200",
                  "opacity-60 hover:opacity-100"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
                {commentCount > 0 && (
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-accent-foreground">
                    {commentCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Comment on Diagram
                  </h3>
                </div>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment about this diagram..."
                  rows={3}
                  className="resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim()}
                    className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCommentForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* SVG container with zoom/pan transform */}
      <div
        className="p-6 [&_svg]:max-w-full [&_svg]:h-auto"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Zoom controls - bottom left */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1 z-10">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className={cn(
            "p-1.5 rounded-md",
            "bg-background/80 backdrop-blur-sm border border-border/50",
            "hover:bg-accent hover:border-accent transition-all duration-200",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <ZoomOut className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-xs text-muted-foreground border border-border/50 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 3}
          className={cn(
            "p-1.5 rounded-md",
            "bg-background/80 backdrop-blur-sm border border-border/50",
            "hover:bg-accent hover:border-accent transition-all duration-200",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </button>
        {scale !== 1 && (
          <button
            onClick={handleReset}
            className={cn(
              "p-1.5 rounded-md ml-1",
              "bg-background/80 backdrop-blur-sm border border-border/50",
              "hover:bg-accent hover:border-accent transition-all duration-200"
            )}
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
