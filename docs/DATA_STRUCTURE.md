# CASPER Data Structure

CASPER separates **entity data** from **sporting event data**.

- JSON registries store who and what exists.
- Sector CSN files store what happened in competitions and matches.
- Awards live in `data/awards.json` and in CSN `aw()` blocks.
- The application joins the two using General IDs.
- Derived statistics are presentation/calculation data, not identity data.

## Sector model

A **Sector** is a geographical area in which CASPER operates remotely.

```text
CASPER
 ├── S1  Sector 1: Saltlake 5
 │    ├── Football / Futsal / Cricsal
 │    ├── Clubs
 │    ├── Players
 │    └── Competitions
 └── S2  Sector 2
```

## Current repository data layer

```text
 data/
 ├── sectors.json
 ├── clubs.json
 ├── player-registry.json
 ├── competitions.json
 ├── awards.json
 ├── dashboard.json          derived-from-CSN flag (not a scorebook)
 ├── manifest.json
 ├── S1/                     Sector 1: Saltlake 5
 │   ├── Football/Season_2026A.csn
 │   ├── Futsal/Season_2026A.csn
 │   └── Cricsal/Season_2026A.csn
 └── S2/
     ├── Football/Season_2026A.csn
     ├── Futsal/Season_2026A.csn
     └── Cricsal/Season_2026A.csn
```

Official 2026A results were copied from `Anish-C2/CASPER`. Mock scorebooks and the old archive directory are gone.

`dashboard.json` is `mock: false`. Homepage totals are computed from CSN match lines.

## Source of truth

| Data | Source |
|---|---|
| Player identity | `data/player-registry.json` |
| Club identity | `data/clubs.json` |
| Sector identity | `data/sectors.json` |
| Competition identity | `data/competitions.json` |
| Official awards | `data/awards.json` + CSN `aw()` |
| Season file index | `data/manifest.json` |
| Match events | `data/{sector}/{Sport}/Season_{season}.csn` |
| Presentation totals | derived from CSN by `js/data.js` |
