'use client';

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-label="loading"
      className="inline-block animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}
