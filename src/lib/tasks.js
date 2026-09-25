// crypto.randomUUID only exists in secure contexts (https/localhost), so build
// a v4 UUID by hand when the app is opened over plain http on the local network.
export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

export function createTask(fields) {
  return {
    id: newId(),
    title: '',
    notes: '',
    due: null,
    time: null,
    priority: 0,
    tags: [],
    done: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    ...fields,
  }
}

// Earliest due first, then earliest time, then highest priority, then oldest.
export function compareTasks(a, b) {
  if (a.due !== b.due) {
    if (!a.due) return 1
    if (!b.due) return -1
    return a.due < b.due ? -1 : 1
  }
  if (a.time !== b.time) {
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time < b.time ? -1 : 1
  }
  if (a.priority !== b.priority) return b.priority - a.priority
  return a.createdAt < b.createdAt ? -1 : 1
}

export function groupBy(items, keyFn) {
  const groups = new Map()
  for (const item of items) {
    const key = keyFn(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return groups
}

// "work, #home errands" -> ["work", "home", "errands"]
export function parseTagInput(value) {
  return [...new Set(value.split(/[\s,]+/).map((t) => t.replace(/^#/, '').toLowerCase()).filter(Boolean))]
}
