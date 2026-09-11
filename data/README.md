# CASPER sector data

Identity stays in the root JSON registries. Match events live in sector folders.
Official 2026A results come from Sector 1: Saltlake 5 (`Anish-C2/CASPER`).

```text
data/
├── sectors.json
├── clubs.json
├── player-registry.json
├── competitions.json
├── awards.json             official 2026A award cabinet
├── dashboard.json          derived-from-CSN flag (not a scorebook)
├── manifest.json           index of every CSN season file
├── S1/                     Sector 1: Saltlake 5
│   ├── Football/Season_2026A.csn
│   ├── Futsal/Season_2026A.csn
│   └── Cricsal/Season_2026A.csn
└── S2/
    ├── Football/Season_2026A.csn
    ├── Futsal/Season_2026A.csn
    └── Cricsal/Season_2026A.csn
```

Rules:

- Folder name is the sector General ID (`S1`, `S2`).
- Sport folders are `Football`, `Futsal`, `Cricsal`.
- One CSN file per sector + sport + season: `Season_2026A.csn`.
- An empty season still gets a file so the tree stays complete.
- CSN references clubs by code (`bbu`, `kko`) and players by name (`Anish`).
- Dashboard totals are computed from CSN. Mock totals have been removed.
