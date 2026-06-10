import { Receipt, ClipboardList, Pill, Briefcase, FlaskConical, Grid2x2 } from 'lucide-react'
import { Category } from '@/types'

export const CATEGORIES: Category[] = [
  {
    id: 'kihon',
    name: '調剤基本料系',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hex: '#3B82F6',
    icon: Receipt,
    sortOrder: 1,
  },
  {
    id: 'yakugaku',
    name: '薬学管理系',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hex: '#10B981',
    icon: ClipboardList,
    sortOrder: 2,
  },
  {
    id: 'generic',
    name: 'ジェネリック',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    hex: '#8B5CF6',
    icon: Pill,
    sortOrder: 3,
  },
  {
    id: 'tokutei',
    name: '特定業務系',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hex: '#F59E0B',
    icon: Briefcase,
    sortOrder: 4,
  },
  {
    id: 'gijutsu',
    name: '調剤技術系',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    hex: '#F43F5E',
    icon: FlaskConical,
    sortOrder: 5,
  },
  {
    id: 'other',
    name: 'その他',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    hex: '#64748B',
    icon: Grid2x2,
    sortOrder: 6,
  },
]

export const getCategoryById = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id)
