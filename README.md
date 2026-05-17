# GGEM Farming Dashboard

Web application for GGEM farming operations: digital checklists, task assignment, live monitoring, aggregation market-day sessions, and leadership metrics.

## Documentation

**Operations manuals and SOPs:** see **[`docs/README.md`](./docs/README.md)**

| Audience | Start here |
|----------|------------|
| Operators | [Getting started](./docs/02-getting-started-operators.md) + your department SOP |
| Managers | [SOP — Manager](./docs/sop-manager.md) |
| Leadership | [SOP — Leadership](./docs/sop-leadership.md) |
| Developers | [Developer guide](./docs/developer-guide.md) |

## Quick start (developers)

```bash
npm install
cp .env.example .env
npm run dev
```

```bash
npm run build
```

Deploy: Firebase Hosting (`dist/`) — see [developer guide](./docs/developer-guide.md).

## Departments

- **Warehouse & Processing** — milling, hubs, inventory, loading  
- **Aggregation** — market day sessions, weighing, QC, EOD  
- **Data and Field** — outreach, monitoring, call centre  

## License

Private — GGEM internal use.
