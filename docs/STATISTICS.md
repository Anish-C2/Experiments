# CASPER Statistics Layer

## Purpose

Every public CASPER page should expose useful statistics instead of acting as a metadata-only directory. The UI uses stat strips, sport blocks, result summaries and entity production rows to keep information density high without shrinking typography.

## Sport separation

Statistics retain their sport identity:

| Sport | Primary | Secondary |
|---|---|---|
| Football | Goals | Matches |
| Futsal | Goals | Matches |
| Cricsal | Runs | Wickets |

Football and futsal goals are never silently combined with Cricsal runs.

## Page coverage

- **Home:** network-wide sport totals, sector summaries, club table, players, results, competitions, records and form.
- **Sectors:** network snapshot and sport splits for every sector.
- **Sector profile:** registered entities, recent form, football/futsal/Cricsal blocks and sport-specific totals.
- **Clubs:** registry counts plus table context, ELO and sport-specific summary rows.
- **Club profile:** squad size, football table record, ELO, result-derived sport splits and player production.
- **Players:** network sport snapshot and per-player production in the directory.
- **Player profile:** identity strip plus one performance block for every available sport row.
- **Competitions:** competition counts by sport/status and linked result availability.
- **Competition profile:** linked matches, participants and sport-specific competition totals.
- **Match Centre:** result count, network sport totals and client-side sport filtering.
- **Records:** network sport snapshot, record board and sport blocks.

## Current data source

`data/dashboard.json` is currently marked `mock: true`. Values sourced from it are presentation data for UI finalization. They are not authoritative historical records.

## Derived result statistics

Where result rows contain a score in the form `A–B`, the presentation layer can derive a total by adding both sides. Football and futsal totals are treated as goals; Cricsal totals are treated as runs. Invalid or non-numeric score rows are ignored rather than converted into guesses.

Competition result matching normalizes punctuation for presentation compatibility, so identifiers such as `OSACR` and `OSA-CR` can be recognized as the same presentation reference. This does not change the registry General ID or archive source data.

## Authority rule

When official CSN archive records are available, they should replace dashboard presentation values for historical statistics. The rendering layer must not become a second database.

## UI rule

Dense does not mean tiny. CASPER increases information density with horizontal stat strips, grouped sport blocks, compact metadata, wide tables and responsive layout. Readability remains a requirement.
