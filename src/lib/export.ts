import type { AnalysisResult, ScanHistoryEntry } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

function row(...cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(escapeCsv).join(',')
}

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

function today(): string {
  return new Date().toISOString().split('T')[0] ?? 'today'
}

// ─── Analysis CSV ─────────────────────────────────────────────────────────────

export function exportAnalysisToCsv(result: AnalysisResult): void {
  const lines = [
    row('AIO Pulse — Analysis Report', today()),
    row(),
    row('Source',            result.source),
    row('Type',              result.type),
    row('Visibility Score',  result.visibilityScore),
    row('Intent',            result.intent),
    row('Intent Confidence', `${result.intentConfidence}%`),
    row('Content Type',      result.contentType),
    row('Tone',              result.tone),
    row('Reading Level',     result.readingLevel),
    row('Audience',          result.audience),
    row(),
    row('Keywords'),
    row('Word', 'Impact (%)', 'Difficulty (/100)'),
    ...result.keywords.map((k) => row(k.word, k.impact, k.difficulty)),
    row(),
    row('Improvement Suggestions'),
    ...result.suggestions.map((s, i) => row(`${i + 1}.`, s)),
  ]
  download(lines.join('\n'), `AIO-Analysis-${today()}.csv`, 'text/csv;charset=utf-8;')
}

// ─── History CSV ──────────────────────────────────────────────────────────────

export function exportHistoryToCsv(history: ScanHistoryEntry[]): void {
  const header = row(
    'ID', 'Date', 'Source', 'Type', 'Engine', 'Model',
    'Visibility', 'Intent', 'Intent Confidence', 'Tone', 'Reading Level',
  )
  const rows = history.map((e) =>
    row(
      e.id,
      new Date(e.timestamp).toLocaleString(),
      e.source,
      e.type,
      e.engine,
      e.model,
      e.visibilityScore,
      e.intent,
      `${e.intentConfidence}%`,
      e.tone,
      e.readingLevel,
    ),
  )
  download([header, ...rows].join('\n'), `AIO-History-${today()}.csv`, 'text/csv;charset=utf-8;')
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export function exportToJson<T>(data: T, filename: string): void {
  download(
    JSON.stringify(data, null, 2),
    `${filename}-${today()}.json`,
    'application/json',
  )
}
