import { Highlight, themes } from "prism-react-renderer";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  // Normalize language names
  const normalizedLang = language.toLowerCase();
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

  return (
    <Highlight theme={themes.vsDark} code={code} language={prismLang}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            "my-6 p-4 rounded-xl overflow-x-auto text-sm",
            className
          )}
          style={style}
        >
          {/* Language label */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
            <span className="uppercase font-medium text-xs text-gray-400 tracking-wide">
              {language || "text"}
            </span>
          </div>

          {/* Code with line numbers */}
          <code className="block">
            {tokens.map((line, i) => {
              // Skip the last empty line that prism adds
              if (i === tokens.length - 1 && line.length === 1 && line[0].empty) {
                return null;
              }
              return (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell pr-4 text-gray-500 select-none text-right w-8 text-xs">
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
  );
}
