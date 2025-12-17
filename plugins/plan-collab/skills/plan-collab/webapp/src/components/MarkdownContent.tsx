import { useCallback, useState, useMemo } from "react";
import { Document, HighlightedSection } from "@/data/documents";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "./MermaidDiagram";
import { LinkedIssuesPanel } from "./LinkedIssuesPanel";
import { TextSelectionPopup } from "./TextSelectionPopup";
import { CodeBlock } from "./CodeBlock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MarkdownContentProps {
  document: Document;
  activeHighlight: string | null;
  onHighlightClick: (highlightId: string) => void;
  onAddComment?: (selectedText: string, content: string, anchorPrefix?: string, anchorSuffix?: string) => void;
}

interface TextSelection {
  text: string;
  position: { x: number; y: number };
  anchorPrefix: string;
  anchorSuffix: string;
}

export function MarkdownContent({ document: doc, activeHighlight, onHighlightClick, onAddComment }: MarkdownContentProps) {
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);

  // Extract code blocks (including mermaid) and tables before processing
  const { processedContent, codeBlocks, tables } = useMemo(() => {
    const blocks: { type: string; content: string; placeholder: string }[] = [];
    const tableBlocks: { content: string; placeholder: string }[] = [];
    let content = doc.content;

    // Match code blocks with language specifier
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let index = 0;

    while ((match = codeBlockRegex.exec(doc.content)) !== null) {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const language = match[1] || "text";
      const code = match[2].trim();

      blocks.push({ type: language, content: code, placeholder });
      content = content.replace(match[0], placeholder);
      index++;
    }

    // Match markdown tables: | header | header |\n|---|---|\n| cell | cell |
    const tableRegex = /^\|(.+)\|\n\|([-:\s|]+)\|\n((?:\|.+\|\n?)+)/gm;
    let tableIndex = 0;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(content)) !== null) {
      const placeholder = `__TABLE_${tableIndex}__`;
      tableBlocks.push({ content: tableMatch[0], placeholder });
      content = content.replace(tableMatch[0], placeholder + "\n");
      tableIndex++;
    }

    return { processedContent: content, codeBlocks: blocks, tables: tableBlocks };
  }, [doc.content]);

  // Handle text selection for comments
  const handleTextSelection = useCallback((e: React.MouseEvent) => {
    if (!onAddComment) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 2) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        // Get anchor context (text before and after selection)
        const fullText = doc.content;
        const startIndex = fullText.indexOf(selectedText);
        const anchorPrefix = startIndex > 0 ? fullText.slice(Math.max(0, startIndex - 50), startIndex) : "";
        const anchorSuffix = fullText.slice(startIndex + selectedText.length, startIndex + selectedText.length + 50);

        setTextSelection({
          text: selectedText,
          position: {
            x: rect.left + rect.width / 2 - 60,
            y: rect.bottom + window.scrollY,
          },
          anchorPrefix,
          anchorSuffix,
        });
      }
    } else {
      // Don't close if clicking inside popup
      const target = e.target as HTMLElement;
      if (!target.closest('[data-selection-popup]')) {
        setTextSelection(null);
      }
    }
  }, [onAddComment, doc.content]);

  const handleAddComment = useCallback((data: { text: string; comment: string; anchorPrefix?: string; anchorSuffix?: string }) => {
    if (!onAddComment) return;

    onAddComment(data.text, data.comment, data.anchorPrefix, data.anchorSuffix);
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [onAddComment]);

  const renderContent = useCallback(() => {
    const elements: JSX.Element[] = [];
    const lines = processedContent.split("\n");
    let firstH1Skipped = false;

    lines.forEach((line, lineIndex) => {
      // Check if this line is a code block placeholder
      const codeBlockMatch = line.match(/__CODE_BLOCK_(\d+)__/);
      if (codeBlockMatch) {
        const blockIndex = parseInt(codeBlockMatch[1]);
        const block = codeBlocks[blockIndex];

        if (block.type === "mermaid") {
          elements.push(
            <MermaidDiagram key={`mermaid-${lineIndex}`} chart={block.content} />
          );
        } else {
          // Syntax-highlighted code block
          elements.push(
            <CodeBlock
              key={`code-${lineIndex}`}
              code={block.content}
              language={block.type}
            />
          );
        }
        return;
      }

      // Check if this line is a table placeholder
      const tableMatch = line.match(/__TABLE_(\d+)__/);
      if (tableMatch) {
        const tableIndex = parseInt(tableMatch[1]);
        const tableBlock = tables[tableIndex];
        if (tableBlock) {
          const tableLines = tableBlock.content.trim().split("\n");
          const headers = tableLines[0].split("|").filter(Boolean).map(h => h.trim());
          const rows = tableLines.slice(2).map(row =>
            row.split("|").filter(Boolean).map(cell => cell.trim())
          );

          elements.push(
            <div key={`table-${lineIndex}`} className="my-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, i) => (
                      <TableHead key={i} className="font-semibold">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        }
        return;
      }

      // Check if this line contains any highlighted text
      let hasHighlight = false;
      let highlightData: HighlightedSection | null = null;

      doc.highlights.forEach((highlight) => {
        if (line.includes(highlight.text)) {
          hasHighlight = true;
          highlightData = highlight;
        }
      });

      // Headers
      if (line.startsWith("# ")) {
        // Skip the first h1 since it's already rendered in the header
        if (!firstH1Skipped) {
          firstH1Skipped = true;
          return;
        }
        elements.push(
          <h1 key={lineIndex} className="text-3xl md:text-4xl font-bold mb-6 mt-8 text-foreground tracking-tight animate-fade-in">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={lineIndex} className="text-2xl md:text-3xl font-semibold mb-4 mt-8 text-foreground animate-fade-in">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        const text = line.slice(4);
        if (hasHighlight && highlightData) {
          const hl = highlightData;
          elements.push(
            <h3 key={lineIndex} className="text-xl md:text-2xl font-semibold mb-3 mt-6 text-foreground animate-fade-in">
              <span
                className={cn("highlight-text", activeHighlight === hl.id && "active")}
                onClick={() => onHighlightClick(hl.id)}
              >
                {text}
              </span>
            </h3>
          );
        } else {
          elements.push(
            <h3 key={lineIndex} className="text-xl md:text-2xl font-semibold mb-3 mt-6 text-foreground animate-fade-in">
              {text}
            </h3>
          );
        }
      }
      // Blockquote
      else if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={lineIndex} className="border-l-4 border-accent pl-6 italic my-6 text-muted-foreground text-lg animate-fade-in">
            {line.slice(2).replace(/"/g, "")}
          </blockquote>
        );
      }
      // List items
      else if (line.startsWith("- ")) {
        elements.push(
          <li key={lineIndex} className="text-lg md:text-xl leading-[1.8] text-foreground/90 ml-6 list-disc animate-fade-in">
            {line.slice(2)}
          </li>
        );
      }
      // Numbered list
      else if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s/, "");
        const match = text.match(/\*\*(.+?)\*\*(.*)$/);
        if (match) {
          elements.push(
            <li key={lineIndex} className="text-lg md:text-xl leading-[1.8] text-foreground/90 ml-6 list-decimal animate-fade-in">
              <strong className="font-semibold">{match[1]}</strong>
              {match[2]}
            </li>
          );
        } else {
          elements.push(
            <li key={lineIndex} className="text-lg md:text-xl leading-[1.8] text-foreground/90 ml-6 list-decimal animate-fade-in">
              {text}
            </li>
          );
        }
      }
      // Regular paragraph
      else if (line.trim() !== "") {
        let renderedLine: React.ReactNode = line;

        // Handle bold text
        renderedLine = line.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            // Check if this bold text is highlighted
            const matchingHighlight = doc.highlights.find(h => h.text === boldText);
            if (matchingHighlight) {
              return (
                <strong
                  key={i}
                  className={cn("font-semibold highlight-text", activeHighlight === matchingHighlight.id && "active")}
                  onClick={() => onHighlightClick(matchingHighlight.id)}
                >
                  {boldText}
                </strong>
              );
            }
            return <strong key={i} className="font-semibold">{boldText}</strong>;
          }

          // Check for highlights in regular text
          let textPart: React.ReactNode = part;
          doc.highlights.forEach((highlight) => {
            if (typeof textPart === 'string' && textPart.includes(highlight.text)) {
              const parts = textPart.split(highlight.text);
              textPart = (
                <>
                  {parts[0]}
                  <span
                    className={cn("highlight-text", activeHighlight === highlight.id && "active")}
                    onClick={() => onHighlightClick(highlight.id)}
                  >
                    {highlight.text}
                  </span>
                  {parts.slice(1).join(highlight.text)}
                </>
              );
            }
          });

          return textPart;
        });

        // Handle inline code
        if (typeof renderedLine === 'string') {
          renderedLine = renderedLine.split(/(`[^`]+`)/).map((part, i) => {
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code key={i} className="bg-muted px-2 py-1 rounded text-base font-mono">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });
        }

        elements.push(
          <p key={lineIndex} className="text-lg md:text-xl leading-[1.8] mb-6 text-foreground/90 animate-fade-in">
            {renderedLine}
          </p>
        );
      }
    });

    return elements;
  }, [processedContent, codeBlocks, tables, doc.highlights, activeHighlight, onHighlightClick]);

  return (
    <article className="prose-reader max-w-none">
      <header className="mb-10 pb-8 border-b border-border">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight animate-fade-in">
          {doc.title}
        </h1>
        {doc.author && doc.readTime && (
          <div className="flex items-center gap-4 text-muted-foreground animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="font-medium">{doc.author}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>{doc.readTime}</span>
          </div>
        )}
      </header>

      {/* Linked Issues */}
      {doc.linkedIssues && doc.linkedIssues.length > 0 && (
        <LinkedIssuesPanel issues={doc.linkedIssues} />
      )}

      <div
        className="animate-fade-in"
        style={{ animationDelay: "200ms" }}
        onMouseUp={handleTextSelection}
      >
        {renderContent()}
      </div>

      {/* Text Selection Popup */}
      {textSelection && onAddComment && (
        <div data-selection-popup>
          <TextSelectionPopup
            selectedText={textSelection.text}
            position={textSelection.position}
            anchorPrefix={textSelection.anchorPrefix}
            anchorSuffix={textSelection.anchorSuffix}
            onAddComment={handleAddComment}
            onClose={() => {
              setTextSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
          />
        </div>
      )}
    </article>
  );
}
