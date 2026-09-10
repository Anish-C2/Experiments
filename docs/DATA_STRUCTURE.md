# CASPER Data Structure

CASPER separates **entity data** from **sporting event data**.

- JSON registries store who and what exists.
- CSN stores what happened in competitions and matches.
- The application/engine joins the two using General IDs.

## Sector model

A **Sector** is a geographical area in which CASPER operates remotely. A Sector is not simply an organisational department; it is a regional sporting jurisdiction containing clubs, players, competitions and sporting activity.

A useful analogy is:

```text
CASPER       → UEFA
Sector 01    → Spain
Sector 02    → Italy
Sector 03    → Germany
Sector 04    → France
```

The names above are only an analogy. Actual CASPER sectors may represent any geographical operating area defined by CASPER.

The hierarchy is therefore:

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

Entities can participate across sectors where the registry explicitly permits it. The sector is the primary geographical context for CASPER statistics and competition discovery.

## Core registries

The initial registry layer contains three files:

```text
player-registry.json
clubs.json
sectors.json
```

### Player registry

```json
{
  "players": [
    {
      "name": "Example Player",
      "birthyear": 2012,
      "clubs": ["abc"],
      "nickname": "xen",
      "sectors": ["SSN"],
      "date_registered": "2026-09-10"
    }
  ]
}
```

### Club registry

```json
{
  "clubs": [
    {
      "name": "Example Club",
      "nickname": "abc",
      "sectors": ["SSN"],
      "date_registered": "2026-09-10"
    }
  ]
}
```

### Sector registry

```json
{
  "sectors": [
    {
      "name": "Example Sector",
      "nickname": "SSN",
      "date_registered": "2026-09-10"
    }
  ]
}
```

## General IDs

CASPER uses compact **General IDs** as references between records.

### Player IDs

A player's `nickname` is a unique **3-letter General ID** among registered players.

Names do not have to be unique. Two players can have the same name as long as their General IDs are different.

The nickname is intended to remain stable during normal profile edits so historical CSN records continue to resolve correctly.

### Club IDs

Clubs use their registered nickname as their General ID.

### Sector IDs

Sectors use their registered nickname as their General ID.

## Sporting statistics

Statistics are **sport-specific** and must never silently combine incompatible scoring systems.

```text
FOOTBALL → goals
FUTSAL   → goals
CRICSAL  → runs + wickets
```

Football and futsal goals are tracked separately even though both are goal-based sports. A football goal total must not include futsal goals.

Cricsal is represented using its own scoring model. Its primary match/player statistics are **runs** and **wickets**, not goals. Cricsal runs and wickets must therefore have dedicated fields, labels and leaderboards in the application.

Cross-sport pages may show multiple sport totals, but each value must retain its sport context.

## Relationships

Registry relationships are represented by General IDs rather than copied objects.

A player can belong to multiple clubs over time, and a club can have multiple players. Players and clubs can be associated with sectors as defined by the registry.

Conceptually:

```text
PLAYER ──< CLUB
   │
   └──< SECTOR
          │
          ├──< CLUB
          ├──< PLAYER
          └──< COMPETITION
```

## Source of truth

| Data | Source |
|---|---|
| Player profile | `player-registry.json` |
| Club profile | `clubs.json` |
| Sector profile | `sectors.json` |
| Match events | CSN |
| Competition structure | CSN |
| Standings | Derived from CSN |
| Football statistics | Derived from CSN |
| Futsal statistics | Derived from CSN |
| Cricsal runs/wickets | Derived from CSN |
| Records | Derived from CSN |

## Derived data

The application should calculate statistics from registered entities and CSN records wherever possible.

Examples include:

- sector totals
- matches played
- wins, draws, and losses
- football goals for and against
- futsal goals for and against
- goal difference within the relevant sport
- Cricsal runs
- Cricsal wickets
- player goals and assists for football/futsal
- player runs and wickets for Cricsal
- cards and disciplinary totals
- competition records
- historical records

## Validation

A registry loader should validate at least:

1. Required fields exist.
2. Player General IDs are exactly three letters.
3. Player General IDs are unique.
4. Club General IDs are unique.
5. Sector General IDs are unique.
6. Referenced club IDs exist.
7. Referenced sector IDs exist.
8. CSN entity references resolve to registered General IDs.
9. Sport-specific statistics are stored and displayed under the correct sport.

## Intentional simplicity

CASPER does **not** use a cryptographic identity layer, hash-based player identity, or permanent numeric player ID in this model.

The goal is a small, understandable registry system that works cleanly with CSN and can be extended as CASPER grows.

For the event notation itself, see [CSN](./CSN.md).
