# CASPER Application Architecture

CASPER is a static statistical database UI. The product priorities are **UI quality** and **data correctness**. The repository therefore separates source data from rendering while keeping the implementation deliberately understandable.

## Source flow

```text
JSON registries + presentation snapshot
                 +
             CSN archive
                 |
            js/data.js
                 |
        validation / references
                 |
          normalized data
          /            \
     js/app.js       js/pages.js
        |                 |
      HOME       directories + profiles
                 |
             shared CSS
```

## Entity sources

- `data/sectors.json` — Sector identity and geographic operating context.
- `data/clubs.json` — Club identity and current sector membership.
- `data/player-registry.json` — Player identity and current club/sector context.
- `data/competitions.json` — Competition identity, sport, sector, type and season.
- `data/dashboard.json` — temporary mock presentation values while the real archive is assembled.

## Archive

`archive/` stores historical sporting records. Archived sporting events are intended to become the authoritative input for calculated statistics. The first demonstration ledger is under `archive/2026A/`.

## JavaScript

### `js/data.js`

Shared data entry point. It fetches all required JSON sources, caches the normalized result for the current page, validates General IDs and references, checks supported sports, and exposes validation status.

### `js/app.js`

Homepage renderer. It owns no registry data.

### `js/pages.js`

Shared renderer for Sector, Club, Player and Competition directories/profiles. Query-string General IDs select detail records.

## Pages

- `index.html` — network dashboard.
- `sectors.html` — Sector directory.
- `sector.html?id=SSN` — Sector profile.
- `clubs.html` — searchable Club directory.
- `club.html?id=NSR` — Club profile.
- `players.html` — searchable Player directory.
- `player.html?id=EXP` — Player profile.
- `competitions.html` — searchable Competition directory.
- `competition.html?id=SSNFB` — Competition profile.
- `matches.html` — Match Centre / result archive view.
- `records.html` — sport-separated records.
- `docs.html` — automatic Markdown documentation browser.

## Shared styling

Every page links to `css/style.css`. There is no page-specific stylesheet. The single stylesheet owns navigation, typography, layout, tables, cards, documentation styling and responsive behavior.

## Sport boundaries

Statistics always retain sport context:

```text
FOOTBALL → goals
FUTSAL   → goals
CRICSAL  → runs + wickets
```

A cross-sport dashboard may display these values together, but it must never silently merge them into one statistic.

## Data rule

Pages render data; they do not become alternate databases. Identity belongs in registries. Sporting events belong in CSN/archive. Derived statistics should eventually be calculated from those records.

## Robustness rule

A broken reference should be visible as a data error rather than silently converted into a plausible-looking value. This is especially important once real historical records replace the mock dashboard.
