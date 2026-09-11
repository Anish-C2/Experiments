# CASPER Data Structure

CASPER separates **entity data** from **sporting event data**.

- JSON registries store who and what exists.
- Sector CSN files store what happened in competitions and matches.
- The application joins the two using General IDs.
- Derived statistics are presentation/calculation data, not identity data.

## Sector model

A **Sector** is a geographical area in which CASPER operates remotely.

```text
CASPER
 ├── SSN
 │    ├── Football / Futsal / Cricsal
 │    ├── Clubs
 │    ├── Players
 │    └── Competitions
 ├── OSA
 ├── CFA
 └── CSA
```

## Current repository data layer

```text
 data/
 ├── sectors.json
 ├── clubs.json
 ├── player-registry.json
 ├── competitions.json
 ├── dashboard.json
 ├── manifest.json
 ├── SSN/
 │   ├── Football/Season_2026A.csn
 │   ├── Futsal/Season_2026A.csn
 │   └── Cricsal/Season_2026A.csn
 ├── OSA/
 ├── CFA/
 └── CSA/
```

Each JSON file has a top-level `schema`, `version`, and `updated` field.

`dashboard.json` is marked `mock: true`. It is a presentation snapshot until every official match is in CSN.

`data/manifest.json` lists every sector/sport/season CSN file. If the manifest is missing, the loader reconstructs the same paths from the sector registry.

Empty seasons still keep a CSN file so the tree stays complete.

## Source of truth

| Data | Source |
|---|---|
| Player identity | `data/player-registry.json` |
| Club identity | `data/clubs.json` |
| Sector identity | `data/sectors.json` |
| Competition identity | `data/competitions.json` |
| Season file index | `data/manifest.json` |
| Match events | `data/{sector}/{Sport}/Season_{season}.csn` |
| Homepage mock totals | `data/dashboard.json` |

## Relationships

```text
PLAYER ──→ CLUB ──→ SECTOR
                  └──→ COMPETITION ──→ Season_2026A.csn
```

For notation, see [CSN](./CSN.md). For validation, see [Data Validation](./DATA_VALIDATION.md).
