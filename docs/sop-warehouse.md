# SOP — Warehouse & Processing

**Department:** Warehouse & Processing  
**Applies to:** Warehouse supervisors, warehouse-supervisor role, warehouse managers  
**Document type:** Standard Operating Procedure  

---

## 1. Purpose

Ensure milling, hub logistics, inventory, maintenance, and dispatch activities are recorded consistently in the GGEM Farming Dashboard so managers and leadership can track tonnage, compliance, and shift handover.

---

## 2. Scope

This SOP covers these checklist types:

| Checklist | Typical use |
|-----------|-------------|
| Milling | Paddy in, milled rice, husk/bran, broken rice by shift |
| Briquette | Briquette production run |
| Hub Collection & Offloading | Produce received at hub |
| Hub Transfer | Movement between hubs / main site |
| Warehouse Closing & Offloading | End of shift / day close |
| Warehouse Maintenance | Equipment and facility checks |
| Warehouse Inventory | Stock counts |
| Loading & Dispatch | Outbound loads |

---

## 3. Roles and responsibilities

| Role | Responsibility |
|------|----------------|
| **Supervisor / warehouse-supervisor** | Complete assigned tasks on time; accurate log tables |
| **Manager** | Assign tasks, review submissions, monitor live tasks |
| **Leadership** | Review warehouse KPIs and live operations (read-only) |

---

## 4. Prerequisites

- User account with warehouse department access  
- Manager has created and assigned tasks for the correct **shift** and **date**  
- Operators know which checklist applies to the current activity (do not use milling form for hub transfer, etc.)

---

## 5. Standard procedure — Supervisor (daily)

### 5.1 Start of shift

1. Log in → **My Tasks**.  
2. Confirm assigned tasks for today’s shift (milling, closing, etc.).  
3. Open the first task; verify checklist name matches your station.  
4. If location is required, confirm **on site** when prompted.

### 5.2 Milling checklist (example)

1. Open **Milling** task.  
2. Complete header fields: shift, variety, supervisor name, equipment checks.  
3. In **log table** rows, enter each run: paddy fed, milled rice, broken, colorsorter, dust, stones — system calculates husk/bran and recovery where configured.  
4. Review **summary** section totals.  
5. Submit when the shift segment is complete.

### 5.3 Hub collection / transfer / loading

1. Use the checklist that matches the physical activity.  
2. Record quantities, references, and times in each section.  
3. For multi-row logs, use **Add row** per truck, batch, or line item.  
4. Submit before handover to next shift if required by local policy.

### 5.4 Warehouse closing

1. Complete closing checklist at end of shift.  
2. Reconcile counts with physical stock where sections require it.  
3. Submit and notify manager if variances exceed tolerance.

### 5.5 End of shift

1. Confirm all tasks show **completed** on My Tasks.  
2. Check **My Submissions** for today’s date.  
3. Report any failed submit or missing task to manager immediately.

---

## 6. Standard procedure — Manager

1. **Task Management** — assign checklist type, assignee, shift, scheduled date.  
2. **Live Monitoring** — watch in-progress warehouse tasks; open row for live field detail.  
3. **Submissions Review** — approve or reject; add comments per local policy.  
4. **Reports** — use for periodic exports (as configured).  
5. For a single task drill-down: open task from monitoring or use task detail route.

---

## 7. Standard procedure — Leadership

1. Open **Leadership** dashboard → select **Warehouse & Processing**.  
2. Use **Live tasks** tab for in-progress work.  
3. Use **Metrics & trends** for milling and warehouse submissions (KPI cards, registers where available).  
4. Click submission rows for read-only detail when offered.

---

## 8. Verification

- [ ] Each physical activity has a matching submitted checklist for the shift  
- [ ] Milling log rows sum to summary totals within expected tolerance  
- [ ] Manager approval status matches finance/ops policy  
- [ ] No duplicate open tasks for the same shift and checklist type  

---

## 9. Exceptions and troubleshooting

| Situation | Action |
|-----------|--------|
| Wrong checklist started | Do not submit; contact manager to reassign |
| Submit failed | Screenshot error; retry; manager may reset task |
| Totals look wrong | Re-check log table rows; empty rows skew summaries |
| Leadership shows “Unknown” variety/shift | Ensure submission used standard shift/variety fields |

---

## 10. Records retention

Submissions remain in Firestore per IT backup policy. PDF/Excel exports (where used) are copies for audit — source of truth is the submitted record in the dashboard.

---

## Related documents

- [Getting started (operators)](./02-getting-started-operators.md)  
- [SOP — Manager](./sop-manager.md)  
- [SOP — Leadership](./sop-leadership.md)
