# CASPER Awards

## Philosophy

CASPER prefers **stat-based awards**. When reliable sporting data exists, awards should be determined from measurable performance rather than subjective voting.

The purpose of the award system is to recognize sporting achievement without creating an unnecessarily large collection of trophies. Awards should have a clear statistical or achievement-based reason to exist.

## Award scopes

CASPER awards operate at different scopes:

### Competition awards

Recognize performance within a single competition.

### Seasonal awards

Recognize performance across the entire sporting season.

### Network / special awards

Recognize the highest-level achievements across CASPER or achievements that cannot reasonably be represented by ordinary competition statistics.

A competition award and a seasonal award may have the same winner when that competition constitutes the entire season. They remain separate honors because their scopes are different.

---

## Competition award limits

**Every competition must have an award limit.**

The limit prevents award padding and ensures that a competition does not produce an arbitrary number of trophies simply because many categories are available.

The limit should reflect the scale and significance of the competition. It is a capacity, not a requirement to fill every slot.

Example framework:

| Competition type | Suggested maximum |
|---|---:|
| Minor / friendly | 1–2 |
| Standard competition | 3–4 |
| Major competition | 5–6 |
| Elite / championship | 7–8 |
| CASPER flagship | 8–10 |

These ranges are guidelines for competition design. The actual award limit is a property of the competition.

### No award padding

A competition does **not** have to use its full award limit.

If there is insufficient reliable data for an award, the award should not be issued. A three-match competition can therefore have meaningful statistical awards without being forced to create awards for categories that cannot be properly supported.

The rule is:

> **Competition size controls award capacity; statistical sufficiency controls award eligibility.**

---

# Seasonal awards

Seasonal awards are awarded for the complete sporting season, regardless of how many competitions make up that season.

A short season is still a valid season. CASPER should reflect the actual sporting calendar rather than inventing a minimum number of matches.

## Core network awards

The core CASPER seasonal awards may include:

- **Athlete of the Season** — highest eligible overall seasonal performance using the defined statistical model.
- **Club of the Season** — highest eligible club performance using the defined seasonal model.
- **Breakthrough Athlete of the Season** — strongest measurable emergence or improvement where sufficient prior data exists.
- **Performance of the Season** — highest eligible single-match performance.
- **Record of the Season** — most significant new CASPER statistical record.

## Football seasonal awards

Football awards remain separate from futsal.

- **Football Player of the Season**
- **Football Golden Boot** — most goals
- **Football Golden Assist** — most eligible assists
- **Football Defender of the Season** — statistical defensive leader where sufficient data exists
- **Football Goalkeeper of the Season** — statistical goalkeeper leader where sufficient data exists
- **Football Goal of the Season** — selected using the defined goal-quality method where supported
- **Football Team of the Season** — statistically selected team where sufficient data exists

## Futsal seasonal awards

Futsal uses its own statistical pool and does not inherit football totals.

- **Futsal Player of the Season**
- **Futsal Golden Boot** — most goals
- **Futsal Golden Assist** — most eligible assists
- **Futsal Defender of the Season** — statistical defensive leader where sufficient data exists
- **Futsal Goalkeeper of the Season** — statistical goalkeeper leader where sufficient data exists
- **Futsal Goal of the Season** — selected using the defined goal-quality method where supported
- **Futsal Team of the Season** — statistically selected team where sufficient data exists

## Cricsal seasonal awards

Cricsal uses runs and wickets rather than football/futsal goals.

- **Cricsal Player of the Season** — best overall eligible seasonal performance
- **Top Run Scorer** — most runs
- **Top Wicket Taker** — most wickets
- **Cricsal Batter of the Season** — role-specific statistical leader where sufficient data exists
- **Cricsal Bowler of the Season** — role-specific statistical leader where sufficient data exists
- **Cricsal All-Rounder of the Season** — combined batting/bowling performance where sufficient data exists
- **Cricsal Performance of the Season** — highest eligible single-match performance
- **Cricsal Team of the Season** — statistically selected team where sufficient data exists

---

## Short-season rule

CASPER does not require a sport to have a large calendar before seasonal awards can exist.

If a sport's complete season consists of **one cup and three matches**, those three matches are the complete seasonal dataset for that sport.

For example, if **Cricsal 2026A** consists of one cup and three matches, a player who scores **44 runs across two matches** can receive **Top Run Scorer** if that is the highest seasonal total. The same player can also receive **Cricsal Player of the Season** if their overall statistical performance is the highest eligible performance. If they also lead the season in wickets and the wicket data is sufficient, they can receive **Top Wicket Taker** as well.

The small sample size should be visible in the award's supporting statistics; it should not invalidate the award.

Example:

```text
CRICSAL 2026A
Season: 2026A
Matches: 3
Competitions: 1 cup

Top Run Scorer
44 runs · 2 appearances

Top Wicket Taker
2 wickets · 2 appearances

Player of the Season
44 runs · 2 wickets · 2 appearances
```

The exact winner and numbers must always come from the authoritative sporting records once those records are available.

---

## Statistical award principles

1. **Use the numbers when the numbers can answer the question.**
2. **Keep sports separate.** Football and futsal goals remain distinct; Cricsal uses runs and wickets.
3. **Do not create an award merely to fill a quota.**
4. **Do not require an artificial minimum season length.**
5. **Show the statistical basis of an award.**
6. **Use composite models only when an award measures multiple aspects of performance.**
7. **Keep discretionary awards rare.**
8. **Competition awards describe one competition; seasonal awards describe the whole season.**
9. **Official archive data is authoritative once available.**

## Award data

Awards should eventually be represented as structured data rather than being hardcoded into page markup.

Example:

```json
{
  "award": "Top Run Scorer",
  "season": "2026A",
  "sport": "cricsal",
  "winner": "xen",
  "competition": "CRIC2026A",
  "scope": "seasonal",
  "basis": "runs",
  "value": 44,
  "status": "official"
}
```

The rendering layer displays award records; it should not become a second source of sporting truth.

## Future implementation

The award calculation layer should derive eligible winners from CSN/archive records and the relevant statistical definitions. Until the official archive is populated, mock awards may be used for UI development but must be clearly marked as mock data and must not be treated as historical records.
