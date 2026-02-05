---
title: Fix Submissions Review Visibility
status: completed
description: Fix the issue where managers see zero pending reviews despite submissions existing. This is caused by missing `taskId` in submission documents and inefficient client-side filtering.
priority: High
complexity: Medium
---

# Problem
The `SubmissionsReview` page and `ManagerDashboard` stats are filtering submissions by fetching *all* submissions and then looking up the related Task to check the department.
However, the `taskId` was not being saved in the `submissions` document during creation in `TaskDetail.jsx`.
This causes the lookups to fail, resulting in 0 visible submissions.
Additionally, the current query strategy is inefficient (N+1 reads and downloading all submissions).

# Solution
1.  **Fix Data Creation**: Update `TaskDetail.jsx` to include `taskId` in the `submissions` document.
2.  **Optimize Dashboard**: Update `ManagerDashboard.jsx` to count pending reviews by querying the `tasks` collection directly (filtering by `department` and `status == 'pending'`). This is faster and doesn't rely on the broken `submissions` link.
3.  **Optimize Review Page**: Update `SubmissionsReview.jsx` to query `tasks` (by department) first, then fetch the linked `submission` document. This ensures that even existing "broken" submissions (which are linked from the Task side) will appear correctly.

# Tasks
- [x] Fix `src/pages/supervisor/TaskDetail.jsx` to add `taskId` to new submissions. <!-- id: 0 -->
- [x] Refactor `src/pages/manager/ManagerDashboard.jsx` to count pending approvals using `tasks` query. <!-- id: 1 -->
- [x] Refactor `src/pages/manager/SubmissionsReview.jsx` to query `tasks` instead of `submissions`. <!-- id: 2 -->
