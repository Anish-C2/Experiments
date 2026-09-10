# CASPER Application Architecture

CASPER is intentionally a static-site application: the repository contains the registries, archived sporting records, presentation layer, and calculation logic. The browser assembles the site from those sources.

## Source layers

```text
JSON registries
    ↓
central data loader
    ↓
validation + reference resolution
    ↓
dashboard/statistics data
    ↓
rendering
    ↓
HTML pages
```

### Entity registries

- `data/sectors.json` — Sector identity and geographic operating context.
- `data/clubs.json` — Club identity and current sector membership.
- `data/player-registry.json` — Player identity and current club/sector context.
- `data/competitions.json` — Competition identity, sport, sector, type and season metadata.

### Presentation snapshot

`data/dashboard.json` contains the current **mock UI dataset** used to populate the homepage while CASPER's real archive is being assembled. It is deliberately separate from entity registries so mock presentation values cannot be mistaken for identity records.

The file is marked with `mock: true`.

### Archive

`archive/` is reserved for historical sporting records. The first demonstration ledger is under `archive/2026A/`.

## JavaScript responsibilities

### `js/data.js`

The single entry point for application data. It:

1. loads every required JSON source;
2. caches each source for the current page load;
3. checks schema containers;
4. checks General ID uniqueness;
5. validates sector, club and competition references;
6. validates supported sport names;
7. returns one normalized application object.

### `js/app.js`

Presentation only. It receives the validated data object and renders the homepage. It does not own the registry data.

This separation means a page can be redesigned without rewriting the data sources.

## Rendering contract

Pages should consume resolved entities instead of embedding repeated identity information. For example, a club table row stores `NSR` and resolves its display name through `clubs.json`.

The same principle applies to players, sectors and competitions.

## Sport boundaries

CASPER statistics preserve sport context:

- Football → goals
- Futsal → goals
- Cricsal → runs + wickets

No generic cross-sport `goals` total is used.

## Shared styling

All pages use `css/style.css`. Page-specific HTML supplies structure; the shared stylesheet owns typography, spacing, panels, tables, responsive behavior and documentation styling.

## Robustness goals

The architecture is optimized around two priorities:

1. **UI consistency** — one visual system across CASPER pages.
2. **Data correctness** — data lives outside presentation code and references are validated before rendering.

Future pages should use the same loader rather than creating their own data objects.
