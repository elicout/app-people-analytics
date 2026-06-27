"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  p: ({ children, node: _node, ...props }) => (
    <p className="mb-2 last:mb-0 leading-relaxed" {...props}>{children}</p>
  ),
  h1: ({ children, node: _node, ...props }) => (
    <h1 className="text-sm font-bold mt-3 mb-1.5 first:mt-0" {...props}>{children}</h1>
  ),
  h2: ({ children, node: _node, ...props }) => (
    <h2 className="text-sm font-bold mt-2.5 mb-1 first:mt-0" {...props}>{children}</h2>
  ),
  h3: ({ children, node: _node, ...props }) => (
    <h3 className="text-[13px] font-semibold mt-2 mb-1 first:mt-0" {...props}>{children}</h3>
  ),
  strong: ({ children, node: _node, ...props }) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
  em: ({ children, node: _node, ...props }) => (
    <em className="italic" {...props}>{children}</em>
  ),
  ul: ({ children, node: _node, ...props }) => (
    <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5" {...props}>{children}</ul>
  ),
  ol: ({ children, node: _node, ...props }) => (
    <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5" {...props}>{children}</ol>
  ),
  li: ({ children, node: _node, ...props }) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  pre: ({ children, node: _node, ...props }) => (
    <pre
      className="bg-gray-100 rounded-lg px-3 py-2.5 overflow-x-auto my-1.5 text-xs"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ className, children, node: _node, ...props }) => {
    // Fenced code blocks: carry a language-* class when a language is specified,
    // or have a trailing "\n" (added by react-markdown) when no language is given.
    // Inline code has neither — single-line, no className, no trailing newline.
    const isBlock =
      !!className?.startsWith("language-") ||
      (typeof children === "string" && children.endsWith("\n"));
    if (isBlock) {
      return (
        <code className={className ? `${className} font-mono` : "font-mono"} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800"
        {...props}
      >
        {children}
      </code>
    );
  },
  blockquote: ({ children, node: _node, ...props }) => (
    <blockquote
      className="border-l-2 border-gray-300 pl-3 text-gray-500 italic my-2"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children, node: _node, ...props }) => {
    if (href?.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-purple-600 underline hover:text-purple-800 transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="text-purple-600 underline hover:text-purple-800 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  table: ({ children, node: _node, ...props }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border-collapse min-w-full" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, node: _node, ...props }) => <thead {...props}>{children}</thead>,
  tbody: ({ children, node: _node, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, node: _node, ...props }) => (
    <tr className="border-b border-gray-200" {...props}>{children}</tr>
  ),
  th: ({ children, node: _node, ...props }) => (
    <th
      className="border border-gray-200 bg-gray-50 px-2 py-1.5 text-left font-semibold text-gray-700"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, node: _node, ...props }) => (
    <td className="border border-gray-200 px-2 py-1.5 text-gray-700" {...props}>
      {children}
    </td>
  ),
  hr: ({ node: _node, ...props }) => (
    <hr className="border-gray-200 my-3" {...props} />
  ),
};

interface MarkdownMessageProps {
  content: string;
}

/** Renders AI assistant markdown with styled HTML — paragraphs, lists, tables, code blocks. */
export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
