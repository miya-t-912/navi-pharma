interface PointsBadgeProps {
  points: number
  prefix?: string
  className?: string
}

export function PointsBadge({ points, prefix, className = '' }: PointsBadgeProps) {
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md px-2 py-0.5 font-bold ${className}`}
    >
      {prefix && <span className="text-xs font-normal text-emerald-500">{prefix}</span>}
      <span className="text-base leading-none">{points}</span>
      <span className="text-xs font-normal">点</span>
    </span>
  )
}
