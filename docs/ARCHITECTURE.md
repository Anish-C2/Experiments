# CASPER Application Architecture

CASPER is a static statistical database UI. Source data stays separate from rendering.

## Source flow

```text
JSON registries + CSN ledgers + awards.json
                 |
            js/data.js
                 |
        validation / references
                 |
          normalized data
                 |
            js/awards.js
                 |
           js/app.js + views.js
                 |
         hash router  #/page/id
```

The UI is a single-page application. `index.html` is the only live document. Routes live in the hash:

- `#/` home dashboard
- `#/sectors` `#/sector/{id}`
- `#/clubs` `#/club/{id}`
- `#/players` `#/player/{id}`
- `#/competitions` `#/competition/{id}`
- `#/matches` `#/records` `#/docs/{file}`

Legacy `*.html` files only redirect into those hashes.

## Entity sources

- `data/sectors.json` — sector identity
- `data/clubs.json` — club identity
- `data/player-registry.json` — player identity
- `data/competitions.json` — competition identity
- `data/awards.json` — official 2026A Sector 1: Saltlake 5 cabinet
- `data/dashboard.json` — derived-from-CSN presentation flag
- `data/manifest.json` — index of sector CSN season files

Official match events live under `data/{sector}/{Sport}/Season_{season}.csn`.
The old `archive/` directory has been removed.

If `manifest.json` is missing, the loader rebuilds the same season paths from the sector registry. A missing empty-season file is a warning. A parsed CSN file with an unknown club or duplicate match id is an error.

Pages render data; they do not become alternate databases.
