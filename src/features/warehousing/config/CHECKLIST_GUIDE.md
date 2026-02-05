# How to Create a New Checklist

This guide explains how to add a new checklist to the system. The system is configuration-driven, meaning you don't need to write complex UI code for every new checklist—you just define the inputs and the system builds it for you.

## Overview
Adding a new checklist involves 3 key steps:
1. **Create the Configuration File**: Define the questions, sections, and logic.
2. **Register the Checklist**: Tell the Supervisor App about the new config.
3. **Update Manager Dashboard**: Allow managers to assign this new checklist type.

---

## Step 1: Create the Configuration File
Create a new file in `src/features/warehousing/config/`. Name it something descriptive, e.g., `pestControlChecklist.js`.

### Template
Copy and paste this template and modify it:

```javascript
/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const myNewChecklistConfig = {
    id: 'my-new-checklist-id', // MUST be unique, no spaces (e.g., 'pest-control')
    title: 'Pest Control Checklist',
    description: 'Weekly inspection of all warehouse sectors',
    
    // Optional: Define location constraints for specific sections
    // locationCheckpoints: {
    //     'section-id': 'location-key-from-locations-js'
    // },

    sections: [
        {
            id: 'section-1-id',
            title: 'Part 1: Exterior Inspection',
            icon: '🏢', // Any emoji works
            description: 'Check perimeter for access points',
            estimatedDuration: 15, // minutes
            requiresLocation: true, // Forces GPS check
            fields: [
                { 
                    id: 'perimeter-check', 
                    type: 'checkbox', 
                    label: 'Perimeter checked for gaps',
                    required: true 
                },
                { 
                    id: 'notes', 
                    type: 'text', 
                    label: 'Observations', 
                    placeholder: 'Enter details...' 
                }
            ]
        },
        {
            id: 'section-2-id',
            title: 'Part 2: Interior Traps',
            icon: '🪤',
            fields: [
                {
                    id: 'trap-log',
                    type: 'log-table',
                    label: 'Trap Inspection Log',
                    columns: [
                        { key: 'trapId', label: 'Trap ID', type: 'text' },
                        { key: 'status', label: 'Status', type: 'select', options: ['Empty', 'Caught', 'Damaged'] }
                    ]
                }
            ]
        }
    ]
};
```

### Available Field Types
- `text`: Single line input.
- `number`: Numeric input.
- `checkbox`: Yes/No tick box.
- `select`: Dropdown menu (requires `options: [{value: 'x', label: 'X'}]`).
- `date`: Date picker.
- `time`: Time picker.
- `log-table`: Dynamic table for adding multiple rows of data.
- `summary`: Automatic summary block (usually at the end).

---

## Step 2: Register the Checklist (Supervisor UI)
Open `src/pages/supervisor/TaskDetail.jsx` and import your new config.

1. **Import the file**:
   ```javascript
   import { myNewChecklistConfig } from '@/features/warehousing/config/pestControlChecklist';
   ```

2. **Add to `CHECKLIST_CONFIGS` dictionary**:
   Find the `CHECKLIST_CONFIGS` object and add your ID:
   ```javascript
   const CHECKLIST_CONFIGS = {
     'milling': millingChecklistConfig,
     'briquette': briquetteChecklistConfig,
     // ... existing configs
     'my-new-checklist-id': myNewChecklistConfig, // <--- ADD THIS LINE
   };
   ```
   > **CRITICAL**: The key ('my-new-checklist-id') MUST match exactly what you use in Step 3.

---

## Step 3: Update Manager Dashboard (Task Creation)
Open `src/pages/manager/TaskManagement.jsx` to allow managers to assign this task.

1. **Add to Filter Dropdown** (Optional but recommended):
   Find the filter `<Select>` (around line 240) and add an item:
   ```javascript
   <SelectItem value="my-new-checklist-id">Pest Control Checklist</SelectItem>
   ```

2. **Add to "New Task" Dialog**:
   Find the "Type" `<Select>` inside the Dialog (around line 375) and add your item:
   ```javascript
   <SelectItem value="my-new-checklist-id">Pest Control Checklist</SelectItem>
   ```

3. **Update Name Logic**:
   In the `onValueChange` handler just above that select (around line 358), add a case to auto-fill the name:
   ```javascript
   val === 'my-new-checklist-id' ? 'Pest Control Checklist' : ...
   ```

---

## How It Works (Database Connection)
You do **not** need to set up any database tables. The system handles this automatically:
1. **Tasks Collection**: When a manager assigns a task, it's created in the `tasks` Firestore collection with `checklistType: 'my-new-checklist-id'`.
2. **Progress Saving**: As the supervisor works, `ChecklistEngine.jsx` saves drafts to `tasks/{taskId}` automatically.
3. **Submission**: When completed, the final report is saved to the `submissions` collection.

## Testing Your New Checklist
1. Go to **Manager Dashboard** > **Task Management**.
2. Click **New Assignment**.
3. Select your new checklist type from the dropdown.
4. Assign it to yourself (or a test user).
5. Log in as that Supervisor.
6. Open the task and verify the form renders correctly.
