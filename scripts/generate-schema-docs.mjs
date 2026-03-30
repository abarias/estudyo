/**
 * generate-schema-docs.mjs
 * Reads prisma/schema.prisma and regenerates docs/schema.md.
 * Run manually:  node scripts/generate-schema-docs.mjs
 * Also runs automatically via Claude Code PostToolUse hook when schema.prisma is saved.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SCHEMA_PATH = join(ROOT, 'prisma/schema.prisma')
const OUTPUT_PATH = join(ROOT, 'docs/schema.md')

// ── Parser ────────────────────────────────────────────────────────────────────

function parseSchema(src) {
  const models = []
  // Match each model block
  const modelRe = /\/\*[\s\S]*?\*\/\s*model\s+(\w+)\s*\{([\s\S]*?)\n\}/g
  const modelRe2 = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g

  let match
  while ((match = modelRe2.exec(src)) !== null) {
    const name = match[1]
    const body = match[2]
    models.push({ name, fields: parseFields(body), raw: body })
  }
  return models
}

const SCALAR_TYPES = new Set([
  'String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt',
])

function parseFields(body) {
  const fields = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('//') || line.startsWith('@') || line.startsWith('@@')) continue

    const tokens = line.split(/\s+/)
    if (tokens.length < 2) continue
    const [name, rawType, ...rest] = tokens
    if (!name || !rawType) continue

    const optional = rawType.endsWith('?')
    const array = rawType.endsWith('[]')
    const baseType = rawType.replace('?', '').replace('[]', '')
    const isRelation = !SCALAR_TYPES.has(baseType)
    const defaultMatch = rest.join(' ').match(/@default\(([^)]+)\)/)
    const defaultVal = defaultMatch ? defaultMatch[1] : null
    const hasIndex = rest.join(' ').includes('@index') || rest.join(' ').includes('@unique') || rest.join(' ').includes('@id')
    const isId = rest.join(' ').includes('@id') || name === 'id'

    fields.push({ name, type: rawType, baseType, optional, array, isRelation, defaultVal, isId })
  }
  return fields
}

// ── Section grouping (mirrors schema comment sections) ────────────────────────

const SECTIONS = {
  'Auth': ['Account', 'Session', 'User', 'VerificationToken'],
  'Studio Catalog': ['Studio', 'StudioInstructor', 'Room', 'ServiceType', 'Product', 'SessionTemplate'],
  'Sessions & Bookings': ['ClassSession', 'Booking', 'Entitlement', 'WaitlistEntry'],
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderField(f) {
  const type = f.isRelation ? `*${f.type}*` : `\`${f.type}\``
  const def = f.defaultVal ? ` — default: \`${f.defaultVal}\`` : ''
  const badge = f.isId ? ' 🔑' : ''
  return `  - **${f.name}** ${type}${def}${badge}`
}

function renderModel(model) {
  const scalar = model.fields.filter(f => !f.isRelation)
  const relations = model.fields.filter(f => f.isRelation)

  const lines = [`### ${model.name}`, '']
  if (scalar.length) {
    lines.push(...scalar.map(renderField))
  }
  if (relations.length) {
    lines.push('', '  **Relations**')
    lines.push(...relations.map(renderField))
  }
  lines.push('')
  return lines.join('\n')
}

function renderSection(title, models, allModels) {
  const names = models ?? allModels.map(m => m.name)
  const found = names.map(n => allModels.find(m => m.name === n)).filter(Boolean)
  if (!found.length) return ''
  return [`## ${title}`, '', ...found.map(renderModel)].join('\n')
}

// ── Entity relationship summary ───────────────────────────────────────────────

const ER_SUMMARY = `## Relationships at a Glance

\`\`\`
User ──────────────┬── owns ──────────▶ Studio
                   ├── tagged to ─────▶ StudioInstructor ──▶ Studio
                   ├── books ─────────▶ Booking ──────────▶ ClassSession
                   ├── holds ─────────▶ Entitlement
                   └── queues ────────▶ WaitlistEntry ────▶ ClassSession

Studio ────────────┬──▶ Room[]
                   ├──▶ ServiceType[]
                   ├──▶ Product[]
                   ├──▶ SessionTemplate[]
                   └──▶ ClassSession[]

SessionTemplate ──────▶ ClassSession[]   (sessions generated from template)
\`\`\`
`

const NOTES = `## Notes for Future Development

- **\`Booking.chargeId\`** — placeholder field, ready for payment gateway integration.
- **\`Entitlement\` / \`Product\`** — fully modelled; credits gate is currently bypassed in the UI. Re-enabling it requires only a UI config change, not a schema change.
- **\`serviceTypeIds\`** on \`Product\` and \`Entitlement\` — stored as JSON strings. Consider normalising into join tables if per-service-type filtering becomes a requirement.
- **\`ClassSession.instructorId\`** — plain \`String\` (not a FK) so sessions survive instructor account deletion.
- **\`WaitlistEntry.status\`** values: \`WAITING\` → \`OFFERED\` → \`ACCEPTED\` / \`EXPIRED\`.
`

// ── Main ──────────────────────────────────────────────────────────────────────

const src = readFileSync(SCHEMA_PATH, 'utf-8')
const models = parseSchema(src)

const sectionBlocks = Object.entries(SECTIONS)
  .map(([title, names]) => renderSection(title, names, models))
  .filter(Boolean)
  .join('\n---\n\n')

// Capture any models not in a named section
const allSectionModels = new Set(Object.values(SECTIONS).flat())
const orphans = models.filter(m => !allSectionModels.has(m.name))
const orphanBlock = orphans.length
  ? renderSection('Other Models', orphans.map(m => m.name), models)
  : ''

const now = new Date().toISOString().split('T')[0]

const output = `# Estudyo — Database Schema

> **Auto-generated** from \`prisma/schema.prisma\` on ${now}.
> To regenerate manually: \`node scripts/generate-schema-docs.mjs\`

---

${sectionBlocks}
${orphanBlock ? `---\n\n${orphanBlock}` : ''}
---

${ER_SUMMARY}
---

${NOTES}`

writeFileSync(OUTPUT_PATH, output.trimStart())
console.log(`✓ docs/schema.md updated (${models.length} models)`)
