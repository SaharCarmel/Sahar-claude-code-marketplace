import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOverflowDetection } from "@/hooks/use-overflow-detection";
import { FullViewModal } from "./FullViewModal";

interface ExpandableContentProps {
  children: React.ReactNode;
  content: string;
  language?: string;
  title?: string;
  className?: string;
  /** Always show the expand button, even if content doesn't overflow */
  alwaysShowButton?: boolean;
}

/**
 * Wrapper component that adds "View Full" functionality to content blocks.
 * Shows a gradient fade indicator when content overflows and a button to
 * open the full content in a modal.
 *
 * Per Candlekeep UI/UX research:
 * - Gradient fade indicates content extends beyond visible area
 * - Hover-to-reveal button keeps UI clean
 * - Modal provides full attention to complex content
 */
export function ExpandableContent({
  children,
  content,
  language,
  title,
  className,
  alwaysShowButton = false,
}: ExpandableContentProps) {
  const [containerRef, isOverflowing] =
    useOverflowDetection<HTMLDivElement>();
  const [modalOpen, setModalOpen] = useState(false);

  const showButton = alwaysShowButton || isOverflowing;

  return (
    <>
      <div className={cn("relative group", className)}>
        {/* Content container with overflow detection */}
        <div ref={containerRef} className="overflow-x-auto">
          {children}
        </div>

        {/* Gradient fade indicator (shown when content overflows) */}
        {isOverflowing && (
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-16 pointer-events-none",
              "bg-gradient-to-l from-background to-transparent",
              "transition-opacity duration-200"
            )}
            aria-hidden="true"
          />
        )}

        {/* View Full button (shown on hover when content overflows or always for code) */}
        {showButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className={cn(
              "absolute right-2 top-2 gap-1.5 h-7 px-2 text-xs",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
              "bg-background/90 backdrop-blur-sm border border-border",
              "shadow-sm z-10"
            )}
          >
            <Maximize2 className="w-3 h-3" />
            View Full
          </Button>
        )}
      </div>

      {/* Full View Modal */}
      <FullViewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        content={content}
        language={language}
        title={title}
      />
    </>
  );
}
