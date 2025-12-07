'use client';

import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import type { Comment } from '@/types';

interface MarkdownRendererProps {
  content: string;
  comments?: Comment[];
  onCommentClick?: (comment: Comment) => void;
}

function slugify(text: React.ReactNode): string {
  if (!text) return '';
  const str = typeof text === 'string' ? text : String(text);
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function MarkdownRenderer({
  content,
  comments = [],
  onCommentClick
}: MarkdownRendererProps) {
  // Create a map of text to comments for highlighting
  const commentMap = useMemo(() => {
    const map = new Map<string, Comment[]>();
    comments.filter(c => c.status === 'OPEN').forEach((comment) => {
      const existing = map.get(comment.anchor_text) || [];
      map.set(comment.anchor_text, [...existing, comment]);
    });
    return map;
  }, [comments]);

  // Get sorted anchor texts (longer first to avoid partial matches)
  const sortedAnchors = useMemo(() => {
    return Array.from(commentMap.keys()).sort((a, b) => b.length - a.length);
  }, [commentMap]);

  // Function to highlight text with comments
  const highlightText = useCallback((text: string): React.ReactNode => {
    if (sortedAnchors.length === 0 || !text) {
      return text;
    }

    // Build regex pattern from all anchors
    const pattern = sortedAnchors.map(escapeRegex).join('|');
    const regex = new RegExp(`(${pattern})`, 'g');

    const parts = text.split(regex);

    if (parts.length === 1) {
      return text;
    }

    return parts.map((part, index) => {
      const matchedComments = commentMap.get(part);
      if (matchedComments && matchedComments.length > 0) {
        return (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-700/50 px-0.5 rounded cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-600/50 transition-colors"
            title={`${matchedComments.length} comment${matchedComments.length > 1 ? 's' : ''}: ${matchedComments[0].content.substring(0, 50)}${matchedComments[0].content.length > 50 ? '...' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onCommentClick) {
                onCommentClick(matchedComments[0]);
              }
            }}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }, [sortedAnchors, commentMap, onCommentClick]);

  // Wrapper to apply highlighting to text children
  const wrapWithHighlights = useCallback((children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return highlightText(child);
      }
      if (React.isValidElement(child) && child.props.children) {
        return React.cloneElement(child, {
          ...child.props,
          children: wrapWithHighlights(child.props.children)
        } as React.HTMLAttributes<HTMLElement>);
      }
      return child;
    });
  }, [highlightText]);

  // Custom components for markdown elements
  const components: Components = {
    // Headers with anchor IDs
    h1: ({ children, ...props }) => (
      <h1
        id={slugify(children)}
        className="text-3xl font-bold mb-4 mt-8 first:mt-0 scroll-mt-20"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        id={slugify(children)}
        className="text-2xl font-semibold mb-3 mt-6 scroll-mt-20"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        id={slugify(children)}
        className="text-xl font-medium mb-2 mt-4 scroll-mt-20"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        id={slugify(children)}
        className="text-lg font-medium mb-2 mt-3 scroll-mt-20"
        {...props}
      >
        {children}
      </h4>
    ),

    // Paragraphs - apply highlighting
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-7" {...props}>
        {wrapWithHighlights(children)}
      </p>
    ),

    // Code blocks
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !className;

      if (isInline) {
        return (
          <code
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    // Pre for code blocks
    pre: ({ children, ...props }) => (
      <pre
        className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-7">{wrapWithHighlights(children)}</li>,

    // Blockquotes - special handling for questions
    blockquote: ({ children }) => {
      const text = String(children);
      const isQuestion = text.includes('[!QUESTION]');

      if (isQuestion) {
        return (
          <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 pl-4 py-2 my-4 rounded-r">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium mb-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Question
            </div>
            <div className="text-sm">{children}</div>
          </div>
        );
      }

      return (
        <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
          {children}
        </blockquote>
      );
    },

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-border">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    th: ({ children }) => (
      <th className="px-4 py-2 font-medium text-left">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 border-t border-border">{wrapWithHighlights(children)}</td>
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary underline hover:no-underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,

    // Horizontal rule
    hr: () => <hr className="my-8 border-border" />,

    // Images
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="max-w-full h-auto rounded my-4" />
    )
  };

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
