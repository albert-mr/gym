'use client';

import { Button } from '@/components/ui/button';

type Props = {
  json: string;
  filename?: string;
  className?: string;
};

export function DownloadJsonButton({ json, filename = 'genlayer-sources.json', className }: Props) {
  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className={className}
      aria-label="Download sources catalog as JSON"
    >
      Download JSON
    </Button>
  );
}
