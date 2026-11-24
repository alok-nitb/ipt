# IPT Survey Analyser

A web app that analyses two questionnaires about intermediate public transport (IPT) stopping near unsignalised intersections, and reports the results by thesis objective:

- **Form A**: IPT operators (auto-rickshaw, shared auto, e-rickshaw, cab)
- **Form B**: road users and pedestrians

> **The two data sets in this repository are simulated.** They show how the analysis works. They are not field responses and say nothing about any real junction. The app, the CSV files and the copied text are all labelled.

## Start

You need [Node.js](https://nodejs.org) 22.18 or newer.

```sh
git clone https://github.com/alok-nitb/ipt.git
cd ipt
npm install
npm run dev
```

Open <http://localhost:8000>. Press `Ctrl + C` in the terminal to stop.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app at http://localhost:8000 |
| `npm run build` | Makes `dist/index.html`, one self-contained file that opens with a double-click, offline |
| `npm run typecheck` | Checks the TypeScript |
| `npm run data` | Regenerates the two simulated sets |

## Use

1. Choose **Set 1** (site U1), **Set 2** (site U2) or **Both** in the top bar. Every page is analysed from that set.
2. Open the pages for the five objectives, the U1 and U2 comparison, or the conclusions.
3. **Present** shows the results full screen. Arrow keys move, `Esc` leaves.
4. To analyse real answers, open **Responses**, then **Import CSV**, and choose the file Google Forms exports (Responses > three dots > Download responses). Answers that declined consent are left out. Imported answers stay in your browser.

| Set | Site | Form A received / analysed | Form B received / analysed |
|---|---|---|---|
| 1 | U1, four-arm, moderate flow | 118 / 115 | 231 / 225 |
| 2 | U2, T-junction, higher flow | 119 / 115 | 229 / 225 |

## Questions

They follow the live Google Forms as read on 25 November 2026, with two exceptions:

- **Form A Q15** uses the report wording (shifting the stop in heavy traffic). The live form asks about stopping at a red signal, which does not apply at unsignalised sites.
- **Form B Q6–Q11** use the printed questionnaire, because the live form does not contain them.

## Analysis

- Shares with 95% Wilson intervals
- Spearman, Kruskal–Wallis, Mann–Whitney and chi-square tests, Holm-adjusted
- Two binary logit models with six predictors each
- Cronbach's alpha
- Bay-offset acceptance, interpolated within the answer classes

Stop durations use class mid-points (5, 15, 25, 45 and 75 s). All answers are self-reported.

## Code

Built with React, TypeScript, Vite, Tailwind CSS, Radix UI and D3.

| Folder | Contents |
|---|---|
| `src/lib` | Questions, statistics, analysis, CSV import and export |
| `src/components` | UI parts, D3 charts, result panels, layout, present mode |
| `src/pages` | Pages |
| `data` | The simulated sets as CSV, and `generate.mjs`, which makes them |
