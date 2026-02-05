# Implementation Plan - Fix Submissions Visibility

## Logic Change
The current system relies on `submissions` collection as the source of truth for reviews, but it heavily depends on joining with `tasks`. Since `tasks` are already department-scoped and contain the status (`pending`, `approved`, `rejected`), it is more efficient to query `tasks` and then fetch the submission content.

## Proposed Changes

### 1. `src/pages/supervisor/TaskDetail.jsx`
**Current:**
```javascript
const submissionWithStatus = {
  ...submissionData,
  status: 'pending',
  supervisorId: currentUser.uid,
  submittedAt: new Date()
};
```
**Change:**
Add `taskId` to the object.
```javascript
const submissionWithStatus = {
  ...submissionData,
  taskId: taskId, // Add this
  status: 'pending',
  supervisorId: currentUser.uid,
  submittedAt: new Date()
};
```

### 2. `src/pages/manager/ManagerDashboard.jsx`
**Current:**
Fetches all submissions, iterates, fetches task for each, counts if department matches.
**Change:**
Use the existing `stats` calculation which already has `pendingTasks`.
The `pendingApprovals` stat is essentially the count of tasks with `status === 'pending'`.
We can simplify the `fetchPendingSubmissions` function or remove it entirely if `pendingTasks` covers it (Task status 'pending' == Submission status 'pending').
*Self-Correction*: `pendingTasks` in the code currently counts `status === 'pending'`. Does `status === 'pending'` on a task mean "Waiting for review"?
In `TaskDetail.jsx`:
```javascript
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'pending', // Changed from 'completed' to 'pending'
```
Yes. When a task is submitted, its status becomes `pending`.
So `stats.pendingTasks` IS the count of pending approvals. We don't need a separate complex query.

### 3. `src/pages/manager/SubmissionsReview.jsx`
**Current:**
Queries `submissions` -> Filters by Task Department.
**Change:**
Query `tasks` where `department == userDepartment` AND `status IN ['pending', 'approved', 'rejected']`.
Iterate these tasks.
For each task, `task.submissionId` should exist.
Fetch the submission using `getDoc(doc(db, 'submissions', task.submissionId))`.
Construct the display object merging Task data and Submission data.

## Verification
1.  **Dashboard**: Check if "Pending Review" count matches the number of pending tasks.
2.  **Review Page**: Check if the "broken" submissions (submitted before the fix) now appear. They should, because the Task has the `submissionId`.
