# CASPER Sports Notation (CSN)

CSN is CASPER's compact notation for recording structured sporting competitions and match events. It is designed to be human-readable, machine-parseable, and compact enough to reference from registry data.

## Design principles

- **Event data lives in CSN.** Clubs, players, sectors, and other entities live in JSON registries.
- **General IDs are references.** CSN should reference registered entities rather than duplicating profile data.
- **Compact syntax.** Repeated structural information is represented with short tokens.
- **Derived statistics are calculated.** Standings, totals, records, and player statistics should be generated from the underlying match/event data.

## Football and futsal match notation

A football/futsal match follows this general shape:

```csn
id="6uvsw3"
bbu-kko:3-3(p2-0)#F{20:gh@bbu1,35:ga@kko2,45:og@kko2,60:hyc@bbu1}(att=120,dur=120);
```

### Components

| Component | Meaning |
|---|---|
| `bbu-kko` | Participants / sides |
| `3-3` | Regulation score |
| `(p2-0)` | Penalty shootout score, when applicable |
| `#F` | Competition stage |
| `{...}` | Match event log |
| `(att=120,dur=120)` | Match metadata |

## Event tokens

Events use a compact `minute:type@entity` form.

Examples:

```text
20:gh@bbu1
35:ga@kko2
45:og@kko2
60:hyc@bbu1
```

Common event codes include:

- `gh` — goal for the home side
- `ga` — goal for the away side
- `og` — own goal
- `hyc` — home yellow card
- `ayc` — away yellow card

The event vocabulary can be extended as CASPER's supported sports and competition rules expand.

## CCSN — Cricsal

Cricsal uses a compact delivery-array notation because its primary statistics are runs and wickets rather than goals.

Canonical form:

```csn
id="ogx7bf"
id="re5wm9"
bbu-kko:[6,2,1,2,2,6,Wd,3]-[3,4,6,2,6Nb,5,3,W]{att=20}#F;
```

### Components

| Component | Meaning |
|---|---|
| `bbu-kko` | Competitor 1 vs competitor 2 |
| `[ ... ]` | One innings delivery array |
| `-` | Separates the two innings |
| `{att=20}` | Match metadata |
| `#F` | Competition stage |

Delivery tokens may be normal run values (`0`, `1`, `2`, `3`, `4`, `6`) or event/extra tokens such as `W`, `Wd`, and `Nb`. Combined tokens such as `6Nb` are permitted by the compact format.

Cricsal is a 1v1 format with a maximum of two overs. Exact scoring/legal-delivery interpretation belongs to the Cricsal ruleset; CSN records the delivery sequence rather than duplicating the rules in every match.

## Competition notation

A competition can contain metadata, groups, matches, awards, rankings, and notes.

```csn
id="cl1z6a"
[
id=...;
e=...;
s=...;
ed=...;
org=...;
fmt=...;
t=...;
grp=...;
tgt=...;
dos=...;
doc=...;
ven=...;
lvl=...;
sts=...;

grp(
  A>bbu,rsa,rut;
);

m(
  # Group A;
  rsa-rut:2-1(y1-0)#GS;
);

aw(
  ch=bbu;
  ru=kko;
);

ranks(
  1>bbu;
  2>kko;
);

nt(
  ...
)
]
```

The exact fields present depend on the competition record. CSN describes sporting structure and results without becoming the database for entity profiles.

## Stages

Common stage identifiers include:

- `#GS` — group stage
- `#R16` — round of 16
- `#QF` — quarter-final
- `#SF` — semi-final
- `#F` — final

Additional stage identifiers may be introduced for specific competition formats.

## Registry boundary

CSN does **not** need to contain full player or club profiles. A registered entity is referenced by its General ID. This keeps records small and prevents identity data from being copied into every match.

For the registry/data model used by CASPER, see [Data Structure](./DATA_STRUCTURE.md).
