import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className={cn("my-6 p-6 rounded-xl bg-card border border-border flex items-center justify-center", className)}>
        <div className="text-muted-foreground text-sm">Loading diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive", className)}>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-6 p-6 rounded-xl bg-card border border-border overflow-x-auto",
        "flex items-center justify-center",
        "[&_svg]:max-w-full [&_svg]:h-auto",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
