# SOP — System administration

**Applies to:** Users with **admin** role  
**Document type:** Standard Operating Procedure  

---

## 1. Purpose

Maintain user access, master reference data, and audit visibility for the GGEM Farming Dashboard.

---

## 2. Admin screens

| Screen | Path | Purpose |
|--------|------|---------|
| Admin dashboard | `/dashboard/admin` | Overview |
| Users | `.../admin/users` | Create/update users, roles, departments |
| Master data | `.../admin/master-data` | Reference lists (hubs, varieties, etc. as configured) |
| Audit log | `.../admin/audit` | Review administrative actions |

---

## 3. User provisioning procedure

1. Open **Users**.  
2. Create user with email matching Firebase Authentication identity.  
3. Set **role**: `supervisor`, `manager`, `leadership`, `admin`, or aggregation field roles (`hub-coordinator`, etc.).  
4. Set **department**: `warehouse`, `aggregation`, or `data-field` (array supported in some setups).  
5. Save — user logs in via Firebase Auth; app reads profile from Firestore `users` (or equivalent collection per implementation).  
6. Verify: user reaches correct dashboard (not Unauthorized).

### Role routing summary

| Role | Landing |
|------|---------|
| admin | Admin dashboard |
| leadership | Leadership dashboard |
| manager | Manager dashboard |
| supervisor | Supervisor / field portal |
| aggregation field roles + dept aggregation | Supervisor / field portal |

---

## 4. Master data procedure

1. Open **Master data**.  
2. Update hubs, labels, or reference values only when operations approves change.  
3. Document change ticket locally; audit log should reflect admin action where wired.

---

## 5. Audit procedure

1. Open **Audit log** after user or master data changes.  
2. Investigate access complaints by correlating timestamp, actor, and action.  
3. Escalate data corruption to development — do not edit production submissions without governance.

---

## 6. Environment and deployment (coordination with IT)

Admins coordinate with developers for:

- Firebase project keys in `.env`  
- Hosting deploy to Firebase Hosting (`dist` folder)  
- Firestore security rules updates  
- Farmer export API URL (`VITE_FARMER_EXPORT_URL`) and CORS  

See [Developer guide](./developer-guide.md).

---

## 7. Verification

- [ ] New hire can log in and see correct department  
- [ ] Terminated user disabled in Firebase Auth  
- [ ] Manager can assign tasks to new supervisor  

---

## Related documents

- [Developer guide](./developer-guide.md)  
- [Data & integrations](./data-and-integrations.md)
