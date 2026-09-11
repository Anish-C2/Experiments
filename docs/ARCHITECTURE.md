# CASPER Application Architecture

CASPER is a static statistical database UI. The product priorities are **UI quality** and **data correctness**. The repository separates source data from rendering while keeping the implementation deliberately understandable.

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

## Statistical coverage

All public data pages now expose a statistical snapshot rather than stopping at identity metadata.

| Page | Statistical layer |
|---|---|
| Home | network-wide sport totals, sectors, clubs, players, results and form |
| Sectors | network totals plus per-sector football, futsal and Cricsal splits |
| Sector profile | sector totals, recent form and three sport blocks |
| Clubs | registry totals plus table/rating context for each club |
| Club profile | squad size, football record, ELO, sport-specific match-derived splits and squad production |
| Players | network sport totals plus player production in directory rows |
| Player profile | identity strip plus every available sport-specific performance row |
| Competitions | competition counts by sport/status plus result availability |
| Competition profile | linked matches, participants and sport-specific competition metrics |
| Match Centre | result count plus football/futsal/Cricsal statistical totals and sport filtering |
| Records | network sport snapshot plus record board and sport blocks |

The UI deliberately uses normal readable text and gains density through layout, grouping and stat strips rather than tiny typography.

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

Shared renderer for Sector, Club, Player and Competition directories/profiles. It now also provides the shared statistical helper layer, sport-separated result aggregation, competition-ID normalization for presentation data, and statistical directory rows.

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
- `records.html` — sport-separated records and network statistical snapshot.
- `docs.html` — automatic Markdown documentation browser.

## Award culture

CASPER prioritizes measurable sporting performance. Awards should be statistically determined whenever reliable data exists, with discretionary recognition reserved for achievements that cannot reasonably be quantified.

Competition awards and seasonal awards have different scopes. Every competition has an explicit award limit to prevent award padding, while statistical sufficiency determines whether a particular award is actually eligible to be issued. A small competition can therefore have meaningful awards without being forced to fill its entire quota.

Seasonal awards are not cancelled merely because a season is short. If a sport's actual calendar contains only one cup and three matches, those three matches constitute the complete season for that sport. Seasonal awards may be derived from those matches when the underlying data is sufficient. A competition award and a seasonal award can have the same winner when the competition constitutes the whole season; they remain separate honors because their scopes differ.

See `docs/STATISTICS.md` for the detailed award framework and examples.

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

## Mock-data rule

`dashboard.json` is currently a presentation snapshot and is explicitly marked `mock: true`. UI values sourced from it are useful for finalizing layout, but they are not promoted to authoritative historical records. When the official archive is populated, calculated values should replace the snapshot values.

## Robustness rule

A broken reference should be visible as a data error rather than silently converted into a plausible-looking value. Sport-specific aggregation must reject invalid numeric scores and never use a football/futsal goal field for Cricsal or vice versa.
