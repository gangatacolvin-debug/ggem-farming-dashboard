# SOP — Manager (all departments)

**Applies to:** Users with **manager** role (warehouse, aggregation, or data-field department on profile)  
**Document type:** Standard Operating Procedure  

---

## 1. Purpose

Define how department managers use the dashboard to **assign work**, **monitor live operations**, **review submissions**, and **close aggregation market days**.

---

## 2. Manager menu (typical)

| Screen | Route (path) | Use |
|--------|----------------|-----|
| Dashboard | `/dashboard/manager` | Summary cards and shortcuts |
| Task Management | `.../tasks` | Create and assign checklist tasks |
| Live Monitoring | `.../monitoring` | In-progress tasks, live detail |
| Submissions Review | `.../submissions` | Approve/reject completed forms |
| Schedules | `.../schedules` | Planned work (where used) |
| Reports | `.../reports` | Operational reports |
| Inventory | `.../inventory` | Warehouse inventory (warehouse dept) |
| Scorecard | `.../scorecard` | Performance views |
| Aggregation Session Hub | `.../aggregation-hub` | **Aggregation managers only** — sessions |
| Hub Management | `.../hub-management` | Hub configuration (where enabled) |
| Task detail | `.../task/:taskId` | Live checklist progress for one task |

Exact sidebar labels may match your deployment.

---

## 3. Daily routine (all departments)

### Morning

1. Log in → Manager dashboard.  
2. **Task Management** — create/assign today’s tasks (checklist type, assignee, shift, date).  
3. Confirm assignees see tasks on **My Tasks**.

### During operations

1. **Live Monitoring** — filter by department; open tasks with status in-progress.  
2. Click a task for **live form data** (read-only progress).  
3. For aggregation: open **Aggregation Session Hub** — confirm session is **Live** and pipeline advancing.

### End of day

1. **Submissions Review** — process pending submissions (approve/reject).  
2. Aggregation: **Seal session** when all five checklists are in and reconciled.  
3. Export session PDF/Excel if archive required.

---

## 4. Task Management procedure

1. Navigate to **Task Management**.  
2. Create new task: select **checklist type**, **assigned user**, **shift**, **scheduled date** as applicable.  
3. Save — task appears in Firestore `tasks` collection with status assigned/pending.  
4. Operator opens task from supervisor portal.  
5. Do not create duplicate tasks for same person, same checklist, same shift unless intentional.

---

## 5. Submissions Review procedure

1. Open **Submissions Review**.  
2. Filter by date, checklist, status (pending/approved/rejected).  
3. Open submission — verify totals, logs, signatures/checkboxes.  
4. **Approve** if compliant; **Reject** with reason communicated offline to operator.  
5. Rejected work may require a new task or correction per local policy (not always automatic in app).

---

## 6. Aggregation Session Hub procedure

1. Open **Aggregation Session Hub**.  
2. **Session register** at top:  
   - Filter All / Live / Closed (90 days)  
   - Click row or **View** for full session dialog  
3. In dialog: KPIs, variety/grade breakdown, weighing log (paginated), **Download Excel** for all farmers.  
4. **Seal session** button (footer) when day is complete — confirms with warning; sets session `closed`.  
5. **Session Detail** and **Timeline** tabs (below register) for selected session from dropdown — optional deep dive.

---

## 7. Live Monitoring procedure

1. Open **Live Monitoring**.  
2. Identify stalled tasks (in-progress too long).  
3. Contact operator; open live detail to see current section/fields filled.  
4. Do not edit operator forms on their behalf unless emergency policy allows.

---

## 8. Verification

- [ ] All shifts have assigned tasks before work starts  
- [ ] No unexplained in-progress tasks after shift end  
- [ ] Submission queue cleared within SLA  
- [ ] Aggregation sessions sealed same day or documented exception  

---

## 9. Escalation

- **Access/roles** → Admin  
- **Wrong data in Firestore** → Developer/IT with audit trail  
- **Farmer API down** → IT; operators may type names manually temporarily  

---

## Related documents

- Department SOPs: [Warehouse](./sop-warehouse.md), [Aggregation](./sop-aggregation.md), [Data & Field](./sop-data-field.md)  
- [SOP — Leadership](./sop-leadership.md)
