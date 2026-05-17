# Developer guide — GGEM Farming Dashboard

## Stack

- **React 19** + **Vite 7**  
- **React Router 7**  
- **Firebase** (Auth, Firestore)  
- **Tailwind CSS** + **shadcn/ui** (Radix)  
- **react-hook-form** for checklists  
- **jspdf** / **xlsx** for exports  

---

## Repository layout (high level)

```
src/
  App.jsx                 # Routes, role guards
  config/
    departments.js        # Department + checklist registry
    fieldPortal.js        # Aggregation field role routing
  context/
    AuthContext.jsx       # Auth + user profile
  features/
    checklists/           # ChecklistEngine, field components, configs
    aggregation/          # Sessions, metrics, exports, farmer registry
    admin/
  pages/
    supervisor/           # Field portal
    manager/
    leadership/
    admin/
  lib/
    firebase.js
docs/                     # Operations + SOPs (this folder)
```

---

## Local setup

### Requirements

- Node.js 18+ (LTS recommended)  
- npm  
- Firebase project with Auth + Firestore enabled  

### Install and run

```bash
npm install
cp .env.example .env
# Fill VITE_FIREBASE_* and optional VITE_FARMER_EXPORT_URL
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build

```bash
npm run build
npm run preview   # optional smoke test of production build
```

Output: `dist/` (used by Firebase Hosting).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | |
| `VITE_FIREBASE_PROJECT_ID` | Yes | |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | |
| `VITE_FIREBASE_APP_ID` | Yes | |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Analytics |
| `VITE_FARMER_EXPORT_URL` | Optional | Defaults to GGEM `exportFarmers` cloud function |

---

## Deployment (Firebase Hosting)

1. `npm run build`  
2. `firebase deploy --only hosting` (project configured in `.firebaserc`)  
3. `firebase deploy --only firestore:rules` when rules change  

`firebase.json` serves `dist` with SPA rewrite to `index.html`.

---

## Adding a checklist

1. Add config under `src/features/<dept>/config/` (see existing `*Checklist.js`).  
2. Register in `ChecklistEngine` / checklist registry if not auto-discovered.  
3. Add checklist id to `DEPARTMENTS_CONFIG` in `src/config/departments.js`.  
4. Add labels in `checklistLabels`.  
5. Test: create task → supervisor submit → manager review → leadership metrics.

### Log table column types

| type | Component |
|------|-----------|
| `text`, `number`, `select` | `LogTableField` built-in |
| `farmer-search` | `FarmerSearchCell` + `farmerRegistry.js` API |

---

## Key shared modules (aggregation)

| Module | Role |
|--------|------|
| `features/aggregation/lib/sessionMetrics.js` | Session KPIs, variety/grade rollups |
| `features/aggregation/components/AggregationSessionsPanel.jsx` | Session register + dialog |
| `features/aggregation/components/AggregationSessionDetailView.jsx` | Session detail body |
| `features/aggregation/components/WeighingLogTable.jsx` | Paginated log + Excel export |
| `features/aggregation/hooks/useSessionSubmissions.js` | Realtime submissions by session id |
| `features/aggregation/lib/ExportService.js` | PDF/Excel |
| `features/aggregation/lib/farmerRegistry.js` | External farmer API cache |

---

## Leadership / manager live views

- `features/checklists/components/LiveTaskDetailView.jsx` — `onSnapshot` on `tasks/{id}`  
- `pages/leadership/kpiService.js` — `resolveChecklistField()` for kebab/camel field ids  

---

## Lint

```bash
npm run lint
```

---

## Release checklist (developers)

- [ ] `.env.example` updated  
- [ ] `npm run build` succeeds  
- [ ] Firestore rules reviewed for production  
- [ ] Farmer API CORS verified on production host  
- [ ] `docs/` reviewed with operations for SOP accuracy  
- [ ] Version bumped in `package.json` when tagging release  

---

## Related

- [Data & integrations](./data-and-integrations.md)  
- [Operator docs index](./README.md)
