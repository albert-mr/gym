'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  markdown: string;
  className?: string;
};

export function CopyForAgentsButton({ markdown, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (older browsers, insecure context). Fall back to a temporary textarea.
      const ta = document.createElement('textarea');
      ta.value = markdown;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
      aria-label="Copy sources catalog for agents"
    >
      {copied ? 'Copied' : 'Copy for agents'}
    </Button>
  );
}
