# CASPER Data Structure

CASPER separates **entity data** from **sporting event data**.

- JSON registries store who and what exists.
- CSN stores what happened in competitions and matches.
- The application/engine joins the two using General IDs.

This keeps the data model simple, avoids duplicated profiles, and makes sporting records reproducible from source events.

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

Example:

```text
Example Player → xen
Example Player → ryu
```

The nickname is intended to remain stable during normal profile edits so historical CSN records continue to resolve correctly.

### Club IDs

Clubs use their registered nickname as their General ID.

Example:

```text
Example Club → abc
```

### Sector IDs

Sectors use their registered nickname as their General ID.

Example:

```text
School Sports Network → SSN
```

## Relationships

Registry relationships are represented by General IDs rather than copied objects.

A player can belong to multiple clubs over time, and a club can have multiple players. A player can also be associated with multiple sectors where applicable.

Conceptually:

```text
PLAYER ──< CLUB
   │
   └──< SECTOR
```

The arrays in the registry records contain references such as `"abc"` or `"SSN"`, not full embedded club/sector objects.

## Source of truth

Each kind of information has one primary home:

| Data | Source |
|---|---|
| Player profile | `player-registry.json` |
| Club profile | `clubs.json` |
| Sector profile | `sectors.json` |
| Match events | CSN |
| Competition structure | CSN |
| Standings | Derived from CSN |
| Player statistics | Derived from CSN |
| Records | Derived from CSN |

This prevents hard-coded statistics from becoming inconsistent with the underlying results.

## Derived data

The application should calculate statistics from registered entities and CSN records wherever possible.

Examples include:

- matches played
- wins, draws, and losses
- goals for and against
- goal difference
- points
- win rate
- player goals and assists
- cards and disciplinary totals
- competition records
- historical records

A UI may cache or display derived values, but the underlying event data remains authoritative.

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

## Intentional simplicity

CASPER does **not** use a cryptographic identity layer, hash-based player identity, or permanent numeric player ID in this model.

The goal is a small, understandable registry system that works cleanly with CSN and can be extended as CASPER grows.

For the event notation itself, see [CSN](./CSN.md).
