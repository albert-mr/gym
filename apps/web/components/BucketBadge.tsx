type Props = {
  bucket: string;
  label?: string;
  color?: string;
  className?: string;
};

// A simple colored dot + label, kept lightweight so it works inside dense tables.
// Color comes from the JSON's bucketColors map (in sync with the classifier).
export function BucketBadge({ bucket, label, color, className = '' }: Props) {
  const text = label ?? bucket;
  const dot = color ?? 'oklch(0.45 0 0)';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      <span className="text-foreground/90">{text}</span>
    </span>
  );
}
