# CASPER Data Validation

CASPER should fail loudly rather than quietly display incorrect statistics.

## Identity checks

Every registry record must have a unique 3-letter General ID (`nickname`) within its registry. Names are not identity keys.

## Reference checks

Before rendering, the data handler validates relationships:

- every club references an existing Sector;
- every player references an existing club and Sector;
- every competition references an existing Sector;
- every competition declares a supported sport;
- dashboard statistics are non-negative.

As the archive grows, match IDs, competition membership, match sport, participant membership and archive references should also be validated.

## Sport checks

| Sport | Primary statistics |
|---|---|
| Football | goals |
| Futsal | goals |
| Cricsal | runs, wickets |

A Cricsal run total must never be displayed as a football/futsal goal total.

## Source-of-truth rule

Identity comes from registries. Sporting events belong in CSN/archive data. Dashboard values are a temporary mock presentation snapshot until the historical archive is connected.

Derived values should eventually be recalculated from event records rather than manually edited on pages.

## Failure behavior

The loader returns:

```js
{
  ok: true,
  errors: [],
  warnings: []
}
```

If a structural or reference check fails, `ok` becomes `false`, the errors are exposed to the application, and the browser logs detailed failures. Network/file loading failures are surfaced as visible CASPER data errors rather than leaving half-populated tables.

## Official-data checklist

Before a dataset is treated as official:

- [ ] schema/version is present;
- [ ] General IDs are unique and stable;
- [ ] all references resolve;
- [ ] dates use one documented format;
- [ ] sport is explicit;
- [ ] competition and season are explicit;
- [ ] match records are preserved in the archive;
- [ ] derived statistics can be reproduced from source events;
- [ ] sport-specific totals are separated;
- [ ] mock data is clearly marked and removed before publication.
