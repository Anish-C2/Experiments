# CASPER Data Structure

CASPER separates **entity data** from **sporting event data**.

- JSON registries store who and what exists.
- CSN/archive data stores what happened in competitions and matches.
- The application joins the two using General IDs.
- Derived statistics are presentation/calculation data, not identity data.

## Sector model

A **Sector** is a geographical area in which CASPER operates remotely. A Sector is a regional sporting jurisdiction containing clubs, players, competitions and sporting activity.

A useful analogy is:

```text
CASPER       → UEFA
Sector 01    → Spain
Sector 02    → Italy
Sector 03    → Germany
Sector 04    → France
```

The names above are only an analogy. Actual CASPER sectors may represent any geographical operating area defined by CASPER.

```text
CASPER
 ├── SECTOR 01
 │    ├── Clubs
 │    ├── Players
 │    ├── Competitions
 │    └── Matches
 ├── SECTOR 02
 │    └── ...
 └── SECTOR N
```

The Sector is the primary geographical context for CASPER statistics and competition discovery.

## Current repository data layer

```text
 data/
 ├── sectors.json
 ├── clubs.json
 ├── player-registry.json
 ├── competitions.json
 └── dashboard.json

 archive/
 └── 2026A/
     └── matches.csn
```

Each JSON file has a top-level `schema`, `version`, and `updated` field. This makes later schema changes explicit instead of silently changing the meaning of old files.

`dashboard.json` is intentionally marked `mock: true`. It is the temporary homepage presentation snapshot while the full historical archive is assembled. It must not be treated as official CASPER statistics.

## Player registry

```json
{
  "schema": "casper.players",
  "version": 1,
  "updated": "2026-09-10",
  "players": [
    {
      "nickname": "xen",
      "name": "Example Player",
      "birthyear": 2012,
      "club": "abc",
      "sector": "SSN",
      "sectors": ["SSN"],
      "date_registered": "2026-09-10"
    }
  ]
}
```

A player's `nickname` is the unique 3-letter General ID. Names do not need to be unique.

## Club registry

```json
{
  "schema": "casper.clubs",
  "version": 1,
  "updated": "2026-09-10",
  "clubs": [
    {
      "nickname": "abc",
      "name": "Example Club",
      "sector": "SSN"
    }
  ]
}
```

## Sector registry

```json
{
  "schema": "casper.sectors",
  "version": 1,
  "updated": "2026-09-10",
  "sectors": [
    {
      "nickname": "SSN",
      "name": "Example Sector",
      "region": "Example Region",
      "status": "active"
    }
  ]
}
```

## Competition registry

Competitions are entities too. Their registry entry identifies the competition without forcing every competition to share the same sporting format.

```json
{
  "nickname": "SSNFB",
  "name": "SSN Premier Division",
  "sector": "SSN",
  "sport": "football",
  "type": "league",
  "season": "2026A",
  "status": "active"
}
```

The competition record can later point into its CSN archive for its actual structure and results.

## General IDs

CASPER uses compact General IDs as references between records.

- Player General ID: unique 3-letter nickname.
- Club General ID: registered club nickname.
- Sector General ID: registered sector nickname.
- Competition General ID: registered competition nickname.

These IDs are references, not hashes and not cryptographic identities.

## Sporting statistics

Statistics are **sport-specific** and must never silently combine incompatible scoring systems.

```text
FOOTBALL → goals
FUTSAL   → goals
CRICSAL  → runs + wickets
```

Football and futsal goals remain separate. Cricsal never uses a goal field for its primary scoring statistics.

## Relationships

```text
PLAYER ──→ CLUB ──→ SECTOR
                  │
                  └──→ COMPETITION

COMPETITION ──→ SEASON ──→ MATCH / CSN
```

Relationships should be represented by General IDs rather than copied profile objects.

## Source of truth

| Data | Source |
|---|---|
| Player identity/profile | `data/player-registry.json` |
| Club identity/profile | `data/clubs.json` |
| Sector identity/profile | `data/sectors.json` |
| Competition identity/metadata | `data/competitions.json` |
| Match events | CSN under `archive/` |
| Standings | Derived from competition rules + match data |
| Football statistics | Derived from football match data |
| Futsal statistics | Derived from futsal match data |
| Cricsal runs/wickets | Derived from Cricsal match data |
| Records | Derived from archived sporting data |
| Homepage mock totals | `data/dashboard.json` until the real archive is connected |

## Data flow

```text
registries + archive
        ↓
    data loader
        ↓
     validator
        ↓
 ID/reference resolution
        ↓
 statistics / standings
        ↓
     page renderers
```

No page should become the source of truth for a statistic.

## Validation

At minimum, the loader validates:

1. required registry containers exist;
2. General IDs are unique within their registry;
3. club → Sector references resolve;
4. player → club and player → Sector references resolve;
5. competition → Sector references resolve;
6. competition sports are supported;
7. dashboard numeric statistics are non-negative;
8. sport-specific fields remain under the correct sport.

The full validation policy is documented in [Data Validation](./DATA_VALIDATION.md).

## Intentional simplicity

CASPER does **not** use a cryptographic identity layer, hash-based player identity, or permanent numeric player ID in this model.

The objective is a small registry model with a strong archival boundary and predictable references.

For application architecture, see [Architecture](./ARCHITECTURE.md). For notation, see [CSN](./CSN.md).
