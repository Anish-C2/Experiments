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

## Award culture

CASPER prefers awards that are supported by measurable sporting performance. Where reliable statistics exist, awards should be determined from the data rather than subjective voting. Discretionary awards should remain limited to achievements that cannot reasonably be quantified.

Awards are also scope-specific:

- **Competition awards** recognize performance within one competition.
- **Seasonal awards** recognize performance across the entire sport season.
- A competition can therefore produce the same winner as a seasonal award when that competition constitutes the whole season; the two awards still represent different scopes.

### Competition award limits

Every competition has an explicit award limit. The limit controls how many awards may be assigned to that competition and prevents award padding. The limit should reflect the competition's scale and significance, but it does not automatically determine which awards are valid.

A small competition can still award meaningful statistical honors when sufficient performance data exists. If a competition does not have enough reliable data for a particular award, that award should simply not be issued.

The principle is:

> **Competition size controls award capacity; statistical sufficiency controls award eligibility.**

### Seasonal awards

Seasonal awards are sport-specific where appropriate and are not cancelled merely because a season is short. A season with only three matches and one cup is still a complete season if that is the actual CASPER calendar.

Core seasonal awards may include:

- **CASPER Athlete of the Season** — highest eligible overall seasonal performance using the defined composite statistical model.
- **CASPER Club of the Season** — highest eligible club performance using the defined seasonal model.
- **Breakthrough Athlete of the Season** — strongest measurable emergence or improvement where sufficient prior data exists.
- **Performance of the Season** — highest eligible single-match performance.
- **Record of the Season** — most significant newly established CASPER statistical record.
- **Sport Player of the Season** — best overall player for that sport using seasonal statistics.
- **Golden Boot / Top Scorer** — most goals in the relevant football or futsal season.
- **Golden Assist / Top Creator** — most eligible assists where the sport's archive records them.
- **Defender of the Season** and **Goalkeeper of the Season** — only where the archive contains enough role-specific data to calculate them.
- **Goal of the Season** — where the sport and archive support a defined selection method.
- **Cricsal Top Run Scorer** — most runs in the Cricsal season.
- **Cricsal Top Wicket Taker** — most wickets in the Cricsal season.
- **Cricsal Batter / Bowler / All-Rounder of the Season** — only when sufficient statistical data supports the role-specific calculation.
- **Sport Team of the Season** — statistically selected team where the sport's data supports a defensible selection.

Seasonal award lists are not required to be fully populated every season. CASPER should issue only awards that have a valid statistical basis.

### Short seasons

A short season is not treated as invalid merely because its sample size is small. For example, if Cricsal 2026A consists of one cup and three total matches, those three matches constitute the full Cricsal season for 2026A. Seasonal awards may therefore be issued from those matches when the underlying statistics are sufficient.

For example, if a player records 44 runs across two of the three matches and leads the season, that player can legitimately receive **Top Run Scorer** and potentially **Cricsal Player of the Season**. If the same player also leads wickets and the data supports it, **Top Wicket Taker** may also be awarded. The short season should be shown transparently in the award record rather than hidden or inflated.

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
