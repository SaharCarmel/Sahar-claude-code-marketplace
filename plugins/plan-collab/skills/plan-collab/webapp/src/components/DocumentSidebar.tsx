import { FileText } from "lucide-react";
import { Document } from "@/data/documents";
import { cn } from "@/lib/utils";

interface DocumentSidebarProps {
  documents: Document[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function DocumentSidebar({ documents, selectedId, onSelect }: DocumentSidebarProps) {
  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-primary font-sans tracking-tight">
          Plan Collab
        </h1>
        <p className="text-sm text-sidebar-foreground/70 mt-1">
          {documents.length} {documents.length === 1 ? 'plan' : 'plans'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <ul className="space-y-1">
          {documents.map((doc, index) => (
            <li key={doc.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
              <button
                onClick={() => onSelect(doc.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent group",
                  selectedId === doc.id
                    ? "bg-sidebar-accent shadow-sm"
                    : "bg-transparent"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      selectedId === doc.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-sidebar-border/50 text-sidebar-foreground/60 group-hover:bg-accent/20"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-medium text-sm leading-tight truncate",
                        selectedId === doc.id
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground"
                      )}
                    >
                      {doc.title}
                    </h3>
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                      {doc.author}
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                      {doc.readTime}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          Select text in the plan to add comments
        </div>
      </div>
    </aside>
  );
}
