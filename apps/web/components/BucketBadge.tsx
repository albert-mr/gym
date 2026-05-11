type Props = {
  bucket: string;
  label?: string;
  color?: string;
  className?: string;
};

export function BucketBadge({ bucket, label, color, className = '' }: Props) {
  const text = label ?? bucket;
  const bg = color ?? '#e2e8f0';
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-ink-900 ${className}`}
      style={{ backgroundColor: bg }}
    >
      {text}
    </span>
  );
}
