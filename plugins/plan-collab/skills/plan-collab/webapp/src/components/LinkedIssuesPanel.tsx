import { ExternalLink, Link2, GitBranch, Circle } from "lucide-react";
import { LinkedIssue } from "@/data/documents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LinkedIssuesPanelProps {
  issues: LinkedIssue[];
}

const priorityColors: Record<string, string> = {
  urgent: "text-red-500 bg-red-500/10",
  high: "text-orange-500 bg-orange-500/10",
  medium: "text-yellow-500 bg-yellow-500/10",
  low: "text-blue-500 bg-blue-500/10",
  none: "text-muted-foreground bg-muted",
};

const statusColors: Record<string, string> = {
  backlog: "text-muted-foreground",
  todo: "text-blue-500",
  "in-progress": "text-yellow-500",
  "in-review": "text-purple-500",
  done: "text-green-500",
  canceled: "text-muted-foreground line-through",
};

export function LinkedIssuesPanel({ issues }: LinkedIssuesPanelProps) {
  if (issues.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Linked Issues
        </h3>
        <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
          {issues.length}
        </span>
      </div>

      <div className="space-y-2">
        {issues.map((issue) => (
          <a
            key={issue.id}
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              "bg-card border border-border",
              "hover:border-accent/50 hover:shadow-sm",
              "transition-all duration-200 group"
            )}
          >
            {/* Status indicator */}
            <Circle
              className={cn(
                "w-3 h-3 mt-1.5 shrink-0 fill-current",
                statusColors[issue.status] || "text-muted-foreground"
              )}
            />

            <div className="flex-1 min-w-0">
              {/* Issue identifier and title */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">
                  {issue.identifier}
                </span>
                {issue.priority && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded capitalize",
                      priorityColors[issue.priority] || priorityColors.none
                    )}
                  >
                    {issue.priority}
                  </span>
                )}
              </div>
              
              <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                {issue.title}
              </p>

              {/* Labels */}
              {issue.labels && issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
