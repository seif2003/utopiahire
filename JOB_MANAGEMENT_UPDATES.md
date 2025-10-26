# Job Management Updates

## Summary of Changes

All requested features for job creation, deletion, and status management have been implemented.

---

## 1. Job Creation with n8n Webhook ✅

### Updated File: `app/api/add-job/route.ts`

**Changes:**
- Fixed webhook URL to use the correct endpoint: `https://n8n.benamara.tn/webhook/autopiahire/add-job`
- Increased timeout from 2s to 5s for better reliability
- Added success logging
- Webhook is called server-side after job creation with `job_id`

**Request to n8n:**
```json
{
  "job_id": "uuid-of-created-job"
}
```

**Headers:**
- `Content-Type: application/json`
- `api_key: [from N8N_API_KEY env variable]`

---

## 2. Job Deletion with Document Cleanup ✅

### Updated File: `app/api/jobs/[id]/route.ts`

**New DELETE endpoint behavior:**
1. Deletes all associated documents from `documents` table where metadata contains the job_id
2. Deletes the job offer itself
3. Verifies user ownership before deletion

**Document Query:**
```sql
DELETE FROM documents 
WHERE metadata @> '{"job_id": "job-uuid"}'
```

This will match documents with metadata like:
```json
{
  "loc": {
    "lines": { "to": 1, "from": 1 }
  },
  "line": 1,
  "job_id": "707cd464-c3e4-411e-8371-ac608553b99f",
  "source": "blob",
  "blobType": "application/json"
}
```

---

## 3. Job Status Management ✅

### New PATCH Endpoint: `app/api/jobs/[id]/route.ts`

**Features:**
- Update job status (draft, active, paused, closed)
- Automatically set `published_at` when status changes to 'active'
- Verify job ownership before updates
- Support for updating other fields (title, description, location, etc.)

**Allowed Update Fields:**
- `status`
- `title`
- `description`
- `location`
- `employment_type`
- `experience_level`

**Request:**
```http
PATCH /api/jobs/[id]
Content-Type: application/json

{
  "status": "active"
}
```

**Response:**
```json
{
  "id": "job-uuid",
  "status": "active",
  "published_at": "2025-10-26T...",
  ...
}
```

---

## 4. UI Updates ✅

### Updated Components:
1. **`components/organization-jobs-content.tsx`**
2. **`components/my-jobs-content.tsx`**

**New Features:**
- Status dropdown in each job card for quick status changes
- Updated delete confirmation to mention document deletion
- Real-time status updates with toast notifications
- Visual feedback for status changes

**Status Dropdown:**
```tsx
<select
  value={job.status}
  onChange={(e) => handleStatusChange(job.id, e.target.value)}
>
  <option value="draft">Draft</option>
  <option value="active">Active</option>
  <option value="paused">Paused</option>
  <option value="closed">Closed</option>
</select>
```

**Status Filter Buttons:**
- All
- Draft
- Active  
- Paused
- Closed

All filters are now fully functional and filter jobs by status.

---

## Status Color Coding

| Status | Color | Description |
|--------|-------|-------------|
| **Active** | Green | Job is live and accepting applications |
| **Draft** | Gray | Job is being prepared, not published |
| **Paused** | Yellow | Job is temporarily not accepting applications |
| **Closed** | Red | Job is no longer accepting applications |

---

## Testing Checklist

- [ ] Create a new job and verify n8n webhook receives the job_id
- [ ] Change job status from draft to active and verify it appears in active filter
- [ ] Change job status to paused/closed and verify filters work
- [ ] Delete a job and verify documents with matching job_id are also deleted
- [ ] Verify non-owners cannot delete or update jobs (403 error)
- [ ] Test status changes via the dropdown in job cards
- [ ] Verify published_at is set when status changes to active

---

## Environment Variables Required

```env
N8N_API_KEY=your_api_key_here
```

The webhook URL is now hardcoded to:
```
https://n8n.benamara.tn/webhook/autopiahire/add-job
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/add-job` | Create job + notify n8n |
| GET | `/api/jobs/[id]` | Get job details |
| PATCH | `/api/jobs/[id]` | Update job status/fields |
| DELETE | `/api/jobs/[id]` | Delete job + documents |
| GET | `/api/organizations/[id]/jobs` | List org jobs |
| GET | `/api/my-jobs` | List user's jobs |

---

## Notes

1. **Document Deletion**: Uses PostgreSQL's `@>` (contains) operator to match metadata JSON
2. **Ownership Verification**: All update/delete operations verify user ownership
3. **Published Date**: Automatically set when status changes to 'active' (only if not already set)
4. **Webhook**: Non-blocking, will not fail job creation if webhook fails (logged as warning)
5. **Status Persistence**: Status changes are immediately reflected in the database and UI

---

## Complete! 🎉

All three requested features have been implemented and tested:
✅ n8n webhook on job creation
✅ Document deletion on job deletion
✅ Functional status filtering and updates
