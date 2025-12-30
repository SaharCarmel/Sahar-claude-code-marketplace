import { useState, useCallback } from "react";
import { Copy, Check, Maximize2 } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FullViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  language?: string;
  title?: string;
}

/**
 * Responsive full-view modal for displaying wide content.
 * Uses Dialog on desktop (>=768px) and Drawer on mobile.
 * Per shadcn/ui docs pattern.
 */
export function FullViewModal({
  isOpen,
  onClose,
  content,
  language,
  title,
}: FullViewModalProps) {
  const [copied, setCopied] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [content]);

  // Normalize language for prism
  const normalizedLang = language?.toLowerCase() || "text";
  const langMap: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    py: "python",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    md: "markdown",
  };
  const prismLang = langMap[normalizedLang] || normalizedLang;
  const isCode = language && language.toLowerCase() !== "text";

  const displayTitle =
    title || (isCode ? `${language?.toUpperCase()} Code` : "Full Content");

  // Copy button component (shared between Dialog and Drawer)
  const CopyButton = () => (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="gap-2 h-8"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </Button>
  );

  // Content renderer (shared between Dialog and Drawer)
  const ContentRenderer = () => (
    <div className="flex-1 overflow-auto">
      {isCode ? (
        <Highlight theme={themes.vsDark} code={content} language={prismLang}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn("m-0 p-4 text-sm min-w-fit", className)}
              style={style}
            >
              <code className="block">
                {tokens.map((line, i) => {
                  // Skip the last empty line that prism adds
                  if (
                    i === tokens.length - 1 &&
                    line.length === 1 &&
                    line[0].empty
                  ) {
                    return null;
                  }
                  return (
                    <div
                      key={i}
                      {...getLineProps({ line })}
                      className="table-row"
                    >
                      <span className="table-cell pr-4 text-gray-500 select-none text-right w-12 text-xs">
                        {i + 1}
                      </span>
                      <span className="table-cell whitespace-pre">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </code>
            </pre>
          )}
        </Highlight>
      ) : (
        <pre className="p-4 whitespace-pre font-mono text-sm bg-muted/50">
          {content}
        </pre>
      )}
    </div>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className={cn(
            "max-w-[90vw] max-h-[90vh] w-full",
            "flex flex-col gap-0 p-0 overflow-hidden"
          )}
        >
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
              <DialogTitle className="text-sm font-medium">
                {displayTitle}
              </DialogTitle>
            </div>
            <CopyButton />
            {/* Hidden description for accessibility */}
            <DialogDescription className="sr-only">
              Full view of content with copy functionality
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <ContentRenderer />
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer (bottom sheet)
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
            <DrawerTitle className="text-sm font-medium">
              {displayTitle}
            </DrawerTitle>
          </div>
          <CopyButton />
          {/* Hidden description for accessibility */}
          <DrawerDescription className="sr-only">
            Full view of content with copy functionality
          </DrawerDescription>
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto max-h-[70vh]">
          <ContentRenderer />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
