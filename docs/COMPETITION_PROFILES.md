# Competition Profiles

## Purpose

`competition.html` is the detailed competition view. It is intentionally more than a metadata card: a competition profile should expose the competition identity, sport context, linked results, participants, format, and derived statistical summary in one place.

## Data flow

```text
competitions.json
       │
       ├── identity / sector / sport / season / type / ruleset / status
       │
       └──────────────┐
                      ▼
                 pages.js
                      ▲
                      │
             dashboard.json
                      │
             linked result rows
                      ▼
             competition profile
```

The registry remains authoritative for competition identity and metadata. Match results must have an explicit competition General ID before they are treated as competition results.

## Profile sections

A competition profile contains:

- **stat strip** — linked matches, participants, sport-specific primary statistic, secondary statistic where available, and format;
- **match centre** — every result whose `competition` field exactly matches the competition General ID;
- **profile metadata** — General ID, sector, season, sport, type, status, and ruleset;
- **participants** — clubs discovered from explicitly linked results;
- **competition structure** — format/ruleset context and a placeholder for future bracket or standings derivation.

## Sport boundaries

Competition metrics never use a generic cross-sport `goals` field.

| Sport | Primary competition metric | Secondary metric |
|---|---|---|
| Football | Goals | Matches |
| Futsal | Goals | Matches |
| Cricsal | Runs | Wickets |

Cricsal score handling is kept separate from football/futsal goal handling.

## Match-link rule

A result is linked to a competition only when:

```text
result.competition === competition.nickname
```

This is deliberate. Prefix matching, guessing from sector, or guessing from round/stage can silently attach a match to the wrong competition and therefore corrupt standings and records.

If no exact links exist, the UI displays an explicit empty state instead of inventing results.

## Knockout and league behavior

- **Cup / knockout:** the profile reports recorded stages and prepares the layout for a future bracket derived from competition-specific match records.
- **League:** the profile prepares the layout for competition-specific standings derived from linked matches.
- A global dashboard table is not reused as a competition-specific table unless the source explicitly identifies the competition.

## Current mock-data limitation

The demonstration archive contains match rows with stage information, while the dashboard contains competition labels for result rows. Until the archive itself carries an unambiguous competition relationship in the established CASPER data model, the profile must not infer one.

This limitation is preferable to displaying attractive but incorrect competition statistics.

## UI principles

The page follows the CASPER information-density rule:

- readable text instead of tiny text;
- multiple information blocks above the fold;
- wide use of the viewport;
- dense statistical tables where data exists;
- clear empty states where data does not exist;
- responsive stacking on small screens;
- no duplicate CSS file; competition styling lives in `css/style.css`.

## Robustness requirements

When adding live competition data:

1. validate the competition General ID;
2. validate its sector and sport references;
3. validate every linked result's competition reference;
4. parse the sport-specific score correctly;
5. derive totals from match records rather than manually entered totals;
6. never mix football, futsal, and Cricsal metrics;
7. show an empty/error state instead of guessing when linkage is incomplete.
