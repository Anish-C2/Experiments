# CASPER sector data

Identity stays in the root JSON registries. Match events live in sector folders.

```text
data/
├── sectors.json
├── clubs.json
├── player-registry.json
├── competitions.json
├── dashboard.json          mock presentation snapshot
├── manifest.json           index of every CSN season file
├── SSN/
│   ├── Football/Season_2026A.csn
│   ├── Futsal/Season_2026A.csn
│   └── Cricsal/Season_2026A.csn
├── OSA/
├── CFA/
└── CSA/
```

Rules:

- Folder name is the sector General ID (`SSN`, `OSA`, `CFA`, `CSA`).
- Sport folders are `Football`, `Futsal`, `Cricsal`.
- One CSN file per sector + sport + season: `Season_2026A.csn`.
- An empty season still gets a file so the tree stays complete.
- CSN references clubs, players and competitions by General ID.
- `dashboard.json` remains a mock totals snapshot until every official match is in CSN.
