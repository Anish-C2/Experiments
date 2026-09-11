# CASPER Awards

CASPER now uses two layers:

1. **Official competition cabinets** from CSN `aw()` blocks and `data/awards.json`.
2. **Calculated seasonal honors** derived from match results, clean sheets, goals-against rate, and crown tournaments.

Jurisdiction notes stay attached to the sector that produced the result. A club may play in two sectors in one season.

---

## How the crown tournament is chosen

For each sector and each sport, CASPER reads `dos` and `doc` from the CSN competition header.

- `dos` = date of start (`DDMMYYYY`)
- `doc` = date of completion (`DDMMYYYY`)

The **last tournament** in that sport is the most prestigious. Sort key is `doc`, then `dos`. Example in Sector 1 futsal: Finale (`doc=21082026`) is later than Pioneer Cup (`doc=05082026`), so Finale is the futsal crown.

If a sport is still in progress and has no champion in `aw().ch` and no completed `#F` match, that crown is pending.

---

## Auto-calculated sport awards (each sector, each hosted sport)

These are computed from CSN match lines, not voted.

| Award | Football | Futsal / Cricsal (1v1) |
|---|---|---|
| Top Scorer | most named goals (`gh=` / `ga=`) | most goals or runs scored, credited to the 1v1 captain |
| Best Defence | lowest GA / match (minimum 2 matches) | same |
| Best Goalkeeper | most clean sheets | same (the 1v1 side that kept the sheet) |

Cricsal wickets stay unrecorded when the official line has no bowler name.

---

## Sector seasonal honors

Each sector awards its own. A sector is **eligible** only if it hosts **2 or 3** sports that season. A one-sport sector cannot receive Golden Sweep / Attacker / Defense.

### CASPER Sector Golden Sweep
Awarded to the **club** that won the crown tournament in every sport that sector hosts. If the sector does not host a sport, that sport is ignored. If it hosts only one sport, nobody is eligible.

### CASPER Sector Golden Attacker
Awarded to the player (or 1v1 captain) who is Top Scorer in every hosted sport. Same 2/3-sport rule.

### CASPER Sector Golden Defense
Awarded to the side that takes Best Defence in every hosted sport. Same 2/3-sport rule.

---

## Decadian awards

Clubs may play in two sectors in the same season.

| Award | Rule |
|---|---|
| CASPER Grand Slam | same club wins Golden Sweep in two sectors, same season |
| CASPER Radioactive Boot | same holder wins Golden Attacker in two sectors, same season |
| CASPER Radioactive Shield | same holder wins Golden Defense in two sectors, same season |

---

## Network seasonal awards

These ignore sector borders.

| Award | Rule |
|---|---|
| CASPER Football / Futsal / Cricsal Tsar | single top scorer across every sector |
| CASPER All-Star Football / Futsal / Cricsal | top 4 producers in that sport from every sector combined |
| CASPER Best Club | aggregated titles, wins and goal difference across all sports and sectors |

---

## Official 2026A competition cabinet — Sector 1: Saltlake 5

Competition-by-competition honors remain in `data/awards.json` and the `aw()` blocks under `data/S1/`.

Titan Cup Top Wicket Taker stays unrecorded because official CSN scorelines do not name bowlers.

The live honor board is `/records.html`.
