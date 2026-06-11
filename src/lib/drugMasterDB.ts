import { ref, set, get, remove } from 'firebase/database'
import { db } from './firebase'
import { DrugMaster } from '@/types'

export type MasterMeta = { count: number; updatedAt: string }

export async function saveMasterToFirebase(drugs: DrugMaster[]): Promise<void> {
  const updatedAt = new Date().toISOString().split('T')[0]
  await Promise.all([
    set(ref(db, 'drugMaster'), drugs),
    set(ref(db, 'meta'), { count: drugs.length, updatedAt }),
  ])
}

export async function loadMasterFromFirebase(): Promise<DrugMaster[] | null> {
  const snap = await get(ref(db, 'drugMaster'))
  if (!snap.exists()) return null
  const data = snap.val()
  return Array.isArray(data) && data.length > 0 ? data : null
}

export async function loadMetaFromFirebase(): Promise<MasterMeta | null> {
  const snap = await get(ref(db, 'meta'))
  if (!snap.exists()) return null
  return snap.val() as MasterMeta
}

export async function deleteMasterFromFirebase(): Promise<void> {
  await Promise.all([
    remove(ref(db, 'drugMaster')),
    remove(ref(db, 'meta')),
  ])
}
