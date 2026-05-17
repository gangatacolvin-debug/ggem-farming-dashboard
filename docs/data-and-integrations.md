# Data model & integrations

Technical reference for developers and power users. Operators should use department SOPs for day-to-day steps.

---

## Firestore collections (main)

| Collection | Purpose |
|------------|---------|
| `users` | Profile: role, department, display name |
| `tasks` | Assigned checklist work in progress |
| `submissions` | Completed checklist payloads |
| `aggregationSessions` | Market day session per hub |
| `farmers` | Legacy/local farmer lookup (optional; aggregation search uses API) |

Exact field names vary by checklist; submissions are generally **flat** with config field ids (often kebab-case).

---

## Task document (in progress)

- `checklistType`, `checklistName`, `status`, `assignedTo`  
- `checklistProgress` — section state and field values while editing  
- `currentSection`, `completedSections`  
- `shift`, `scheduledDate`, `lastUpdated`  
- `locationCompliant` / `checklistProgress._location` for on-site  

---

## Submission document (completed)

- `checklistType`, `checklistName`, `submittedAt`, `submittedBy`  
- Field values at top level (e.g. `total-weight-kg`, `farmer-weighing-logs`)  
- Aggregation link: `session-id` and/or `session-id-ref` (both may exist during migration)  
- Review: `status` (pending/approved/rejected) where implemented  

**Note:** Some configs use `milling-process` on submission but `milling` on tasks — `CHECKLIST_TYPE_ALIASES` in `departments.js` normalizes for department routing.

---

## Aggregation session document

- `sessionId` — business id (shared across checklists)  
- `hub` — slug: `main-site`, `dwangwa-hub`, `linga-hub`, `suluwi-hub`, `salima-hub`  
- `status` — `active` | `closed`  
- `createdAt`, `updatedAt`, `closedAt`  
- `assignedTeam`, `openedByUid`, `department: 'aggregation'`  

---

## Farmer export API (aggregation search)

**Default URL:**  
`https://us-central1-ggem-farming-4a93d.cloudfunctions.net/exportFarmers`

**Response shape:**

```json
{
  "count": 3644,
  "farmers": [
    { "firstName": "...", "lastName": "...", "gender": "Female" }
  ]
}
```

**Client:** `src/features/aggregation/lib/farmerRegistry.js`  
- Loads once per browser session, caches in memory  
- `searchFarmers(term, limit)` — min 2 characters  

**UI:** `FarmerSearchCell` in log tables where column `type: 'farmer-search'`.

**CORS:** Browser must be allowed by the cloud function. If blocked, configure `Access-Control-Allow-Origin` on the function or proxy through your backend.

---

## Exports

| Export | Entry point | Output |
|--------|-------------|--------|
| Session PDF | Session detail → Export | Summary + weighing table |
| Session Excel | Session detail → Export | Summary + weighing + QC sheets |
| Weighing log Excel | Weighing table → Download Excel | Formatted columns + totals row |

Implementation: `src/features/aggregation/lib/ExportService.js`

---

## Query patterns

**Submissions for a session:**

```text
submissions where session-id-ref == {sessionId}
submissions where session-id == {sessionId}
```

(Merge results — both field names used historically.)

**Active sessions:**

```text
aggregationSessions where status == 'active'
```

---

## Field resolution (read paths)

`resolveChecklistField(doc, fieldKey)` in `kpiService.js` tries:

1. kebab-case and camelCase on doc  
2. `checklistProgress`, `formData`  
3. Nested section scan via `getValue()`  

Use this for leadership/metrics when Firestore shapes differ between task and submission.

---

## Related

- [SOP — Aggregation](./sop-aggregation.md)  
- [Developer guide](./developer-guide.md)
