# Changelog

All notable changes to the toolkit are documented here. This project follows
a framework-first approach: structure first, concrete capabilities added in
small increments.

## [v0.2] — 2026-11-12 — Offline data preservation

Focus: make the toolkit usable for company project management without a
server, and give every change a durable record.

**Added**
- `Data & Records` center with four tabs: Backup & export, Version history,
  Change log, Safe-keeping guide.
- Portable `.sqt.json` snapshots (`format: sqt-workspace`, schema version 1)
  containing the full project tree, information blocks, activities, view
  state, revision, author and change log, with an FNV-1a integrity checksum.
- Snapshot import with validation, node normalisation, checksum warning,
  and *Replace* / *Merge* modes.
- Auto-save to a linked snapshot file on Chromium over `https://`, with a
  standard download fallback everywhere else.
- Attributed change log (timestamp, author, action, project, node, detail),
  capped at 500 entries and stored inside the snapshot.
- Eight rolling in-browser version checkpoints with restore.
- Human-readable exports: Quality Record (`.md`), Node Register (`.csv`) and
  Change Log (`.csv`).
- Live backup-status indicator in the top bar and on the home navigation.
- Repository files: README, LICENSE, `.gitignore`, `.gitattributes`,
  `.nojekyll`, `index.html` Pages entry, Chinese data-handling guide and a
  fictional sample snapshot.

**Changed**
- Persistence key `sqt.framework.v1` → `sqt.framework.v2`, with automatic
  migration of existing local data.
- All meaningful mutations now go through `commit()` (log + checkpoint +
  dirty flag); `save()` is reserved for pure UI state.
- Export filenames include seconds so successive saves never overwrite.

**Known limitation**
- Single-user model, last-write-wins. No concurrency control or permissions.

## [v0.1] — 2026-11-12 — Framework

- Dark, all-English UI based on the SQT mark palette
  (`#5273FF` / `#FFAF06` / `#14BB87` on near-black).
- Entry page with Add Project and recent-project cards.
- Three-column workspace: `clamp(260px,21vw,310px) | 1fr | clamp(300px,25vw,360px)`.
- Project tree: Cluster / SWC nodes, inline add, delete, collapse, filter,
  and press-and-hold drag with reorder + reparenting.
- Node information: Basic Information / Quality Plan / Risk Assessment,
  each independently editable.
- Quality activities: KPI Monitoring, SWA Audit, PPA Release with checklists
  and completion tracking.
- `localStorage` persistence and three fictional sample projects.
