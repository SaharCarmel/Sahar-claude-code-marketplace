import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FileCode2, Terminal, Link2 } from "lucide-react";

type CodeType = 'file' | 'command' | 'url' | 'default';

// Detection patterns - ordered most specific first
const PATTERNS = {
  url: /^(https?:\/\/|www\.)[^\s]+$/i,
  file: /^(?:\.{0,2}\/)?(?:[\w-]+\/)*[\w.-]+\.(ts|tsx|js|jsx|py|go|rs|java|css|html|json|yaml|yml|md|sh|sql)$/i,
  command: /^(npm|yarn|pnpm|git|docker|node|python|pip|cargo|go|make)\s/i,
};

// Style mappings
const STYLES: Record<CodeType, string> = {
  file: "text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50",
  command: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
  url: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
  default: "bg-muted text-foreground",
};

const ICONS: Record<CodeType, React.ComponentType<{ className?: string }> | null> = {
  file: FileCode2,
  command: Terminal,
  url: Link2,
  default: null,
};

function detectCodeType(content: string): CodeType {
  const trimmed = content.trim();
  if (PATTERNS.url.test(trimmed)) return 'url';
  if (PATTERNS.file.test(trimmed)) return 'file';
  if (PATTERNS.command.test(trimmed)) return 'command';
  return 'default';
}

export function InlineCode({ children }: { children: string }) {
  const codeType = useMemo(() => detectCodeType(children), [children]);
  const Icon = ICONS[codeType];
  const baseClasses = "px-1.5 py-0.5 rounded text-sm font-mono inline-flex items-center gap-1";

  return (
    <code className={cn(baseClasses, STYLES[codeType])}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </code>
  );
}
