# SOP — Leadership

**Applies to:** Users with **leadership** role  
**Document type:** Standard Operating Procedure  

---

## 1. Purpose

Provide leadership with **cross-department visibility**: live operations, historical metrics, and aggregation session audits without changing operational data (read-only oversight).

---

## 2. Leadership dashboard structure

1. Log in → **Leadership** dashboard.  
2. Top level: department selector or tabs — **Warehouse**, **Aggregation**, **Data and Field**.  
3. Each department has sub-tabs (varies by department):

| Department | Typical tabs |
|------------|----------------|
| Warehouse | Live tasks, Metrics & trends (milling KPIs, registers) |
| Aggregation | Sessions, Live tasks, Metrics & trends |
| Data & Field | Live tasks, Metrics & trends |

Inline banner may show **live aggregation hubs** when sessions are active.

---

## 3. Live operations procedure

### 3.1 Live tasks (all departments)

1. Open department → **Live tasks**.  
2. Table lists **in-progress** tasks only (paginated).  
3. Columns: checklist, assignee, hub/location, progress %, last updated.  
4. Click row or **View** → large dialog with **live form data** (updates in real time).  
5. Use for spot checks — do not contact operators through the app unless your process says so.

### 3.2 Aggregation sessions

1. Open **Aggregation** → **Sessions**.  
2. Register shows hub, status, date, rice kg, MWK, checklist progress (x/5).  
3. Filter: All | Live | Closed (last 90 days for closed).  
4. **View** → session dialog:  
   - Totals and variety/grade breakdown  
   - Reconciliation flags  
   - Weighing log with search and Excel export  
5. **Live tasks** tab for operators still filling forms.

### 3.3 Warehouse metrics

1. Open **Warehouse** → **Metrics & trends**.  
2. Review milling KPIs, variety tables, submission register.  
3. Click submission row for read-only drill-down where implemented.

---

## 4. Decision support (how to use data)

| Question | Where to look |
|----------|----------------|
| Is the hub running today? | Aggregation → Sessions (Live) or top banner |
| How much rice bought today at Dwangwa? | Sessions → View → Rice purchased (kg) |
| Is milling behind? | Warehouse → Live tasks or Metrics |
| Who is late on a checklist? | Department → Live tasks → last updated |

---

## 5. Exports

From aggregation session dialog (and manager hub):

- **PDF** — summary report  
- **Excel (full session)** — multiple sheets  
- **Excel (weighing log only)** — all farmers, formatted columns  

Leadership uses exports for board packs and audits; source of truth remains Firestore submissions.

---

## 6. Verification (weekly oversight)

- [ ] Live sessions match physical hub calendar  
- [ ] Closed sessions in last 90 days have 5/5 checklists where policy requires  
- [ ] Large reconciliation gaps investigated with operations manager  
- [ ] Milling metrics align with warehouse manager reports  

---

## 7. Limitations (this release)

- Leadership cannot seal aggregation sessions (manager only).  
- Some leadership menu items (Reports, Performance placeholders) may be stubs — use department metrics tabs.  
- Metrics may include pending submissions unless filtered by policy.

---

## Related documents

- [Overview](./01-overview.md)  
- [SOP — Aggregation](./sop-aggregation.md)  
- [SOP — Manager](./sop-manager.md)
