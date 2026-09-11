# CASPER Data Validation

CASPER should fail loudly rather than quietly display incorrect statistics.

## Reference checks

- every club references an existing Sector
- every player references an existing club and Sector
- every competition references an existing Sector and a supported sport
- dashboard statistics are non-negative
- every CSN season file listed in `data/manifest.json` is fetched
- CSN home/away clubs resolve
- CSN competitions resolve and keep the same sport as the file
- CSN match ids are unique across the ledger

If `manifest.json` is missing, the loader rebuilds `data/{sector}/{Sport}/Season_{season}.csn` paths from the sector registry instead of crashing.

## Sport folders

| Sport | Primary statistics | Season folder |
|---|---|
| Football | goals | `Football/` |
| Futsal | goals | `Futsal/` |
| Cricsal | runs, wickets | `Cricsal/` |

A football/futsal CSN file must not use delivery-array notation. A Cricsal file must not use goal notation.

## General IDs

| Entity | Pattern | Examples |
|---|---|---|
| Sector | 2–6 letters/digits | `S1`, `S2` |
| Club | 2–6 letters/digits | `bbu`, `rsa`, `sey` |
| Player | 2–20 letter name | `Anish`, `Rio`, `Divyanshu` |
| Competition | 3–8 letters/digits | `pc26a`, `fsc26a` |

Player nicknames are first names from the registry, not forced 3-letter codes.
