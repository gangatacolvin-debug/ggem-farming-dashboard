# SOP — Aggregation (market day)

**Department:** Aggregation  
**Applies to:** Hub coordinator, security, data team, warehouse supervisor at hub, aggregation supervisors, aggregation managers  
**Document type:** Standard Operating Procedure  

---

## 1. Purpose

Run a complete **market day** at a hub: open a session, grade and weigh farmer rice, receive stock in warehouse, reconcile end of day, and seal the session — with full traceability in the dashboard.

---

## 2. Scope

Checklists in order (typical):

1. **Pre-Aggregation Setup** — opens session, team roster, expected farmers  
2. **Quality Control & Grading** — moisture/grade per farmer batch  
3. **Weighing & Recording** — farmer weights, prices, receipts  
4. **Warehouse & Stock Receiving** — bags/weight received  
5. **End of Day Reconciliation** — totals and farmer counts  

All forms for one day share one **session ID** at one **hub**.

---

## 3. Roles and responsibilities

| Role | Responsibility |
|------|----------------|
| **Hub coordinator** | Pre-aggregation setup; session open |
| **QC staff** | Quality control & grading log |
| **Security / weighing** | Weighing & recording log |
| **Warehouse lead at hub** | Stock receiving |
| **Data team** | Support reconciliation / EOD |
| **Manager** | Monitor hub, seal session, export reports |
| **Leadership** | Review sessions register and KPIs |

---

## 4. Prerequisites

- Hub slug is valid (Main Site, Dwangwa, Linga, Suluwi, Salima — as configured)  
- Internet connectivity for farmer name search and Firestore sync  
- Farmer master list loads from export API (see troubleshooting if not)

---

## 5. Standard procedure — Opening the market day

### 5.1 Pre-Aggregation Setup (session open)

1. Log in to field portal (**My Tasks**).  
2. Open **Pre-Aggregation Setup** task.  
3. Complete: hub, expected farmers, team present (coordinator, security, warehouse, data).  
4. Submit — this creates/links an **active aggregation session** for the hub.  
5. Note the **session ID** shown (manager and leadership can see it in Session Hub).

**Verification:** Manager sees session under **Aggregation Session Hub** as **Live**.

---

## 6. Standard procedure — During the day

### 6.1 Quality Control & Grading

1. Open assigned QC task (same session).  
2. For each farmer batch, **Add row** in moisture & grading log.  
3. **Farmer name:** type at least 2 letters → select from search list (do not retype full name manually if search works).  
4. Enter variety, moisture %, grade, decision (Accepted/Rejected), notes.  
5. Submit section or full form per task design.

### 6.2 Weighing & Recording

1. Open **Weighing & Recording** task.  
2. For each farmer at the scale, **Add row**.  
3. **Farmer name:** use search (same as QC).  
4. Enter club/group, farmer type, variety, grade, weight (kg), price/kg — gross (MWK) may auto-calculate.  
5. Confirm farmer verified / receipt issued fields per policy.  
6. End-of-weighing checks: all receipts, totals, end time.  
7. Submit when weighing station closes.

### 6.3 Warehouse & Stock Receiving

1. Record bags and weight received vs weighing station.  
2. Submit when warehouse intake is complete.

### 6.4 End of Day Reconciliation

1. Enter farmers attended, booked, unbooked, session weight totals.  
2. Cross-check against weighing totals.  
3. Submit to close operational data entry for the day.

---

## 7. Standard procedure — Manager (close day)

1. Open **Aggregation Session Hub**.  
2. Use **Session register** — find today’s hub session (Live).  
3. Click **View** — review:  
   - All 5 checklists submitted  
   - Reconciliation (bags, kg, farmers) without red discrepancies beyond tolerance  
   - Weighing log paginated; use **Download Excel** for full farmer list if needed  
4. **Seal session** when satisfied (irreversible — records read-only).  
5. Export PDF/Excel for archive if required.

---

## 8. Standard procedure — Leadership (oversight)

1. Leadership dashboard → **Aggregation** department.  
2. **Sessions** tab: filter Live / Closed (90 days).  
3. Click session → dialog: rice by variety/grade, weighing log, exports.  
4. **Live tasks** tab for operators still filling forms.  
5. **Metrics** tab for checklist-level submission history.

---

## 9. Farmer search (operators)

- Field shows a **search icon**.  
- Type **2 or more characters** of first or last name.  
- Tap the correct farmer from the dropdown.  
- Full name is filled automatically.  
- If list does not load, check internet; contact manager (API/CORS may need IT fix).

---

## 10. Verification (end of market day)

- [ ] Session status = **closed** (after manager seal)  
- [ ] 5/5 checklist types submitted for session ID  
- [ ] Weighing total kg ≈ warehouse received kg (within agreed tolerance)  
- [ ] Farmer count EOD ≈ farmers weighed  
- [ ] Excel weighing log exported and filed if required locally  

---

## 11. Exceptions

| Situation | Action |
|-----------|--------|
| Second session same hub same day | Manager policy — avoid duplicate active sessions |
| Farmer not in search list | Enter name manually only if policy allows; note in QC |
| Wrong session linked | Stop submit; manager investigates session-id on submissions |
| Cannot seal | All required submissions must exist; check Session Hub pipeline |

---

## Related documents

- [Getting started](./02-getting-started-operators.md)  
- [SOP — Manager](./sop-manager.md)  
- [Data & integrations](./data-and-integrations.md) (session ID, collections)
