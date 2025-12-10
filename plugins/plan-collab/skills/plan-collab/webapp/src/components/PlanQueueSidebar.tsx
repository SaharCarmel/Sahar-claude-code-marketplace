import { FileText, Clock, MessageSquare, User, Trash2, RefreshCw, CheckCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlanSummary, PlanStatus } from "@/api/planCollab";

interface PlanQueueSidebarProps {
  plans: PlanSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
  onSetStatus?: (id: string, status: PlanStatus) => void;
  onRefresh?: () => void;
  sessionId?: string;
}

function getStatusBadge(status: PlanStatus) {
  switch (status) {
    case 'working':
      return (
        <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
          Working
        </Badge>
      );
    case 'updated':
      return (
        <Badge className="bg-orange-500/90 hover:bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">
          Updated
        </Badge>
      );
    case 'done':
      return (
        <Badge className="bg-green-600/90 hover:bg-green-600 text-white text-[10px] px-1.5 py-0 h-4">
          Done
        </Badge>
      );
    default:
      return null;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function PlanQueueSidebar({
  plans,
  selectedId,
  onSelect,
  onRemove,
  onSetStatus,
  onRefresh,
  sessionId,
}: PlanQueueSidebarProps) {
  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-sidebar-primary font-sans tracking-tight">
            Plan Collab
          </h1>
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-sidebar-foreground/70 mt-1">
          {plans.length} {plans.length === 1 ? "plan" : "plans"} in queue
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {plans.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No plans in queue</p>
            <p className="text-xs mt-1">Push a plan from Claude Code to begin</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {plans.map((plan, index) => (
              <li
                key={plan.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                <button
                  onClick={() => onSelect(plan.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent group relative",
                    selectedId === plan.id
                      ? "bg-sidebar-accent shadow-sm ring-1 ring-accent"
                      : "bg-transparent",
                    plan.status === 'done' && "opacity-60",
                    plan.status === 'working' && "ring-1 ring-blue-500/30",
                    plan.status === 'updated' && "ring-1 ring-orange-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-md transition-colors shrink-0",
                        selectedId === plan.id
                          ? "bg-accent text-accent-foreground"
                          : "bg-sidebar-border/50 text-sidebar-foreground/60"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={cn(
                            "font-medium text-sm leading-tight truncate",
                            selectedId === plan.id
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground",
                            plan.status === 'done' && "text-sidebar-foreground/50"
                          )}
                        >
                          {plan.title}
                        </h3>
                        {plan.isOwn && (
                          <Badge variant="outline" className="text-xs shrink-0 px-1.5 py-0">
                            <User className="w-3 h-3 mr-0.5" />
                            You
                          </Badge>
                        )}
                        {getStatusBadge(plan.status)}
                      </div>

                      <p className="text-xs text-sidebar-foreground/60 mt-1 truncate">
                        {plan.name}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-sidebar-foreground/50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(plan.pushedAt)}
                        </span>
                        {plan.stats.openComments > 0 && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <MessageSquare className="w-3 h-3" />
                            {plan.stats.openComments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons - shown at bottom right on hover */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar/90 backdrop-blur-sm rounded-md p-0.5">
                    {/* Mark Done / Reactivate button */}
                    {onSetStatus && (
                      plan.status === 'done' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetStatus(plan.id, 'pending');
                          }}
                          title="Reactivate plan"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetStatus(plan.id, 'done');
                          }}
                          title="Mark as done"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )
                    )}
                    {/* Remove button */}
                    {onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(plan.id);
                        }}
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          Select text in plans to add comments
        </div>
      </div>
    </aside>
  );
}
