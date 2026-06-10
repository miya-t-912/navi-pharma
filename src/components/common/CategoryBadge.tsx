import { getCategoryById } from '@/data/categories'
import { CategoryId } from '@/types'

interface CategoryBadgeProps {
  categoryId: CategoryId
  size?: 'sm' | 'md'
}

export function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const category = getCategoryById(categoryId)
  if (!category) return null

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${category.bgColor} ${category.color} ${category.borderColor} ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px]'
          : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className="text-[11px]">{category.icon}</span>
      {category.name}
    </span>
  )
}
