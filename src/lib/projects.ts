import type { TextLayer } from './text-layer'

export interface SavedProject {
  id: string
  image: string
  preview?: string | null
  layers: TextLayer[]
  naturalSize: { w: number; h: number } | null
  savedAt: number
}

const KEY = 'saved-projects'

export function loadProjects(): SavedProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveProject(project: SavedProject) {
  const list = [project, ...loadProjects()].slice(0, 20)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function deleteProject(id: string) {
  const list = loadProjects().filter((p) => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}
