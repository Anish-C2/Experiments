# SPA — CASPER Statistics Command Center

Official Single Page App for [CASPER](https://github.com/Anish-C2/CASPER).

SPA reads **CSN** and derives statistics, rankings, records and profiles. Nothing on the dashboard is a hand-typed score.

Sports are separate domains: futsal goals, football goals and cricket runs are never merged.

## Pipeline

CSN files → `js/parser.js` → `js/engine.js` → `js/ui.js` + `js/app.js`

New `*.csn` files listed in a sport `manifest.json` are picked up without UI changes.

## Check

    node js/test-node.js

## Pages

Settings → Pages → Deploy from branch `main` `/`. `.nojekyll` is included.
