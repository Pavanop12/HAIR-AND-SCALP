import { supabase } from './supabase'

const BUCKET = 'scalp-images'

function extractStoragePathFromUrl(url, userId) {
  if (!url || typeof url !== 'string') return null
  if (!url.startsWith('http')) {
    return url.replace(/^\/+/, '')
  }

  const bucketMarker = `/${BUCKET}/`
  const idx = url.indexOf(bucketMarker)
  if (idx === -1) return null

  const afterBucket = url.slice(idx + bucketMarker.length)
  const clean = decodeURIComponent(afterBucket.split('?')[0] || '').replace(/^\/+/, '')
  if (!clean) return null

  // Ensure we only return paths that belong to this user folder.
  if (userId && !clean.startsWith(`${userId}/`)) return null
  return clean
}

function tryParseEpochMsFromName(name) {
  // upload path is `${user.id}/${Date.now()}.${ext}`
  const base = name.split('/').pop() || name
  const num = (base.split('.')[0] || '').trim()
  const ts = Number(num)
  return Number.isFinite(ts) ? ts : null
}

async function signedOrPublicUrl(path) {
  const { data: signed, error: signedErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (!signedErr && signed?.signedUrl) return signed.signedUrl
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return pub?.publicUrl ?? null
}

export async function attachScanImageUrls(scans, userId) {
  if (!userId || !Array.isArray(scans) || scans.length === 0) return scans

  // List files for this user and match by closest timestamp (when DB row has no image_url).
  const { data: files } = await supabase.storage.from(BUCKET).list(userId, {
    limit: 200,
    sortBy: { column: 'name', order: 'desc' },
  })

  const candidates = (files || [])
    .filter(f => f?.name)
    .map(f => ({ name: f.name, epochMs: tryParseEpochMsFromName(f.name) }))
    .filter(c => c.epochMs)
    .sort((a, b) => b.epochMs - a.epochMs)

  const createdAtMs = (s) => {
    const t = new Date(s.created_at).getTime()
    return Number.isFinite(t) ? t : null
  }

  const enriched = await Promise.all(scans.map(async (s) => {
    const existingPath = extractStoragePathFromUrl(s?.image_url, userId)
    if (existingPath) {
      // Refresh each Supabase storage URL to avoid broken private/public assumptions
      // and expired signed links.
      const refreshed = await signedOrPublicUrl(existingPath)
      return refreshed ? { ...s, image_url: refreshed } : s
    }

    if (s?.image_url) return s
    const t = createdAtMs(s)
    if (!t || candidates.length === 0) return s

    let best = null
    let bestDiff = Infinity
    for (const c of candidates) {
      const diff = Math.abs(c.epochMs - t)
      if (diff < bestDiff) {
        best = c
        bestDiff = diff
      }
      // Candidates are sorted by time; once diff starts growing past a reasonable window,
      // keep it simple and break early.
      if (bestDiff === 0) break
    }

    // Only accept a close match (within 2 hours) to avoid mismapping.
    if (!best || bestDiff > 2 * 60 * 60 * 1000) return s

    const fullPath = `${userId}/${best.name}` // list() returns names relative to user folder
    const url = await signedOrPublicUrl(fullPath)
    if (!url) return s
    return { ...s, image_url: url }
  }))

  return enriched
}

