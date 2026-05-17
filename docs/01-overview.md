# Overview — GGEM Farming Dashboard

## What this system is

The **GGEM Farming Dashboard** is a web application for recording and reviewing operational work across GGEM farming operations. Staff complete **digital checklists** on phones or computers; managers assign work and review submissions; leadership sees live progress and historical metrics.

The app connects to **Google Firebase** (authentication + database). Data is stored in **Firestore** and shown in real time where configured.

---

## User roles

| Role | Typical user | Main screens |
|------|----------------|--------------|
| **Supervisor** | Warehouse or field supervisor | My tasks, checklist forms, my submissions |
| **Field roles (aggregation)** | Hub coordinator, security, data team, warehouse lead at hub | Same as supervisor (field portal) when department is Aggregation |
| **Manager** | Department manager | Dashboard, task management, submissions review, live monitoring, reports |
| **Leadership** | Senior operations / executives | Department tabs, live operations, aggregation sessions, warehouse KPIs |
| **Admin** | IT / system owner | Users, master data, audit log |

After login, each user is routed automatically to the correct dashboard.

---

## Departments

Three active departments are configured in the app:

### 1. Warehouse & Processing

Milling, briquette production, hub collection/offloading, transfers, warehouse closing, maintenance, inventory, and loading/dispatch.

### 2. Aggregation

Market-day operations at hubs: pre-aggregation setup, quality control & grading, weighing & recording, warehouse stock receiving, and end-of-day reconciliation. Work is grouped into **aggregation sessions** (one market day per hub).

### 3. Data and Field

Outreach & engagement, sales & marketing, field monitoring & QA, and call centre oversight.

Each department has its own checklists, manager tools, and leadership views. See the department **SOP** in this folder.

---

## Core concepts

### Task

A **task** is work assigned to someone (e.g. “Complete milling checklist for Shift A”). While in progress, progress is saved on the task document (`tasks` collection). Supervisors open tasks from **My Tasks** and fill sections step by step.

### Submission

When a checklist is **submitted**, a **submission** document is created (`submissions` collection). That record is what managers **approve/reject** and what leadership uses for **metrics and registers**. Submitted data is flat on the submission document (field IDs as stored by the form).

### Aggregation session

For aggregation only, a **session** (`aggregationSessions` collection) represents one market day at one hub. It has a **session ID** shared across all aggregation checklists for that day. Status is **active** (live) or **closed** (sealed). Managers can seal a session when the day is complete.

### Live vs historical

- **Live tasks** — checklists still in progress (`tasks` with status in-progress).  
- **Submissions** — completed forms, any approval status.  
- **Leadership / manager “live” views** — read task or session data with real-time updates where implemented.

---

## Location (on-site / off-site)

Some checklists record whether the user is **on site** at the expected location. Leadership and manager live views show **On site** / **Off site** when that data is captured.

---

## Approvals

Managers review submissions in **Submissions Review**. Until reviewed, leadership metrics may still show pending items depending on the screen. Follow your local policy for who must approve before numbers count as final.

---

## Related documents

- Operators: [Getting started](./02-getting-started-operators.md) + your department SOP  
- Managers: [SOP — Manager](./sop-manager.md)  
- Developers: [Developer guide](./developer-guide.md), [Data & integrations](./data-and-integrations.md)
