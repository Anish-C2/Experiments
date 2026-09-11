# CASPER Application Architecture

CASPER is a static statistical database UI. Source data stays separate from rendering.

## Source flow

```text
JSON registries + dashboard snapshot
                 +
     data/{sector}/{Sport}/Season_{season}.csn
                 |
            js/data.js
                 |
        validation / references
                 |
          normalized data
          /            \
     js/app.js       js/pages.js
```

## Entity sources

- `data/sectors.json` — sector identity
- `data/clubs.json` — club identity
- `data/player-registry.json` — player identity
- `data/competitions.json` — competition identity
- `data/dashboard.json` — mock presentation snapshot
- `data/manifest.json` — index of sector CSN season files

Official match events live under `data/{sector}/{Sport}/Season_{season}.csn`.
`archive/2026A/` is a legacy pointer only.

If `manifest.json` is missing, the loader rebuilds the same season paths from the sector registry. A missing empty-season file is a warning. A parsed CSN file with an unknown club or duplicate match id is an error.

Pages render data; they do not become alternate databases.
