'use client';

import { marked } from 'marked';

export default function MarkdownResult({ content, className = '' }) {
  const htmlContent = marked(content || '', { breaks: true });

  return (
    <div className={className}>
      <div
        className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
