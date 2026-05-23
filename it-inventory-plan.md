# IT Closet Inventory System — Plan

## Overview

A web-based inventory management tool for the school IT department. The primary purpose is tracking check-outs and check-ins of physical technology assets (devices, peripherals, cables, accessories). Assets are scoped per department for flexibility. Students may check items in and out themselves with a teacher's permission, which is recorded on the checkout. Built as one of the 10 school tools within the `school-hub` app.

---

## Core Features

### 1. Asset Registry
- Add, edit, and archive any physical IT asset
- Asset fields:
  - **Name** (e.g., "Lenovo Chromebook 14")
  - **Asset Tag / Serial Number**
  - **Category** (Laptop, Desktop, Monitor, Tablet, Printer, Network Equipment, Cable, Accessory, etc.)
  - **Make / Model**
  - **Condition** (New, Good, Fair, Damaged, Broken)
  - **Status** (Available, Checked Out, Retired)
  - **Department** (the department that owns this asset)
  - **Location** (Room number, closet label, cart name)
  - **Purchase Date**
  - **Warranty Expiration Date**
  - **Cost**
  - **Notes / Tags**

### 2. Check-Out / Check-In
- Any user (IT staff, teacher, or student) can initiate a checkout or return
- **Student self-checkout**: when a student checks out an item, the permitting teacher's name must be entered and is stored on the record — the teacher does not need to interact with the system
- When assignee type is "student", search and select from the existing student roster — no manual name entry
- Record:
  - Assignee (student record link, or free-text name for staff/classroom)
  - Permitting teacher name (required when the checkout is performed by a student)
  - Date checked out
  - Expected return date
  - Condition at checkout
- Check-in flow records:
  - Date returned
  - Condition at return
  - Any damage notes
- View all currently checked-out items and overdue returns

### 3. Search & Filter
- Full-text search across name, serial number, and asset tag
- Filter by: category, status, condition, location, assignee
- Sort by any column (name, date, condition, etc.)

### 4. Inventory Dashboard
- Summary cards: Total Assets, Checked Out, Low Stock items
- Recently added assets
- Overdue check-outs (past expected return date)

### 5. Low Stock / Consumables Tracking
- Mark categories as consumables (cables, batteries, cleaning kits, etc.)
- Set a minimum quantity threshold per consumable type
- Dashboard alert when stock falls below threshold

### 6. Reports & Export
- Generate reports:
  - Full inventory list
  - All currently checked-out items
  - Overdue items
  - Assets by condition
- Export any report to **CSV**
- Print-friendly view

### 7. Audit Log
- Immutable log of every change to every asset:
  - Who made the change (logged-in user)
  - Timestamp
  - What changed (field, old value, new value)
  - Action type (Created, Updated, Checked Out, Checked In, Retired)

### 8. Role-Based Access
- **IT Admin** — full CRUD on all assets, can view audit log and all reports
- **IT Staff** — can check out/in, view inventory
- **Student / Teacher** — can check out and return items; student checkouts require a permitting teacher name to be recorded

---

## Data Model

### `InventoryItem`
```typescript
interface InventoryItem {
  id: string;
  name: string;
  assetTag: string;
  serialNumber?: string;
  category: AssetCategory;
  make?: string;
  model?: string;
  condition: AssetCondition;
  status: AssetStatus;
  location: string;
  purchaseDate?: string;       // ISO date
  warrantyExpiration?: string; // ISO date
  cost?: number;
  notes?: string;
  tags?: string[];
  isConsumable: boolean;
  minimumQuantity?: number;    // only if isConsumable
  quantity?: number;           // only if isConsumable
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  departmentId: string;          // scoped to a department within the org
}

type AssetCategory =
  | 'laptop' | 'desktop' | 'tablet' | 'monitor'
  | 'printer' | 'network' | 'cable' | 'accessory' | 'other';

type AssetCondition = 'new' | 'good' | 'fair' | 'damaged' | 'broken';
type AssetStatus = 'available' | 'checked-out' | 'retired';
```

### `CheckoutRecord`
```typescript
interface CheckoutRecord {
  id: string;
  itemId: string;
  assigneeType: 'student' | 'staff' | 'classroom';
  // Students: resolved from existing student records
  studentId?: string;          // links to Student record (required when assigneeType === 'student')
  assigneeName: string;        // denormalized display name
  // Staff/classroom: free-text name
  checkedOutAt: string;        // ISO datetime
  expectedReturnAt?: string;
  checkedInAt?: string;
  conditionOut: AssetCondition;
  conditionIn?: AssetCondition;
  damageNotes?: string;
  checkedOutBy: string;        // uid of the user who performed the checkout
  permittingTeacherName?: string; // required when checkedOutBy is a student
  checkedInBy?: string;
  organizationId: string;
  departmentId: string;
}
```

### `AuditEntry`
```typescript
interface AuditEntry {
  id: string;
  itemId: string;
  action: 'created' | 'updated' | 'checked-out' | 'checked-in' | 'retired';
  changedBy: string;           // uid
  changedByName: string;
  timestamp: string;           // ISO datetime
  diff?: Record<string, { before: unknown; after: unknown }>;
  organizationId: string;
}
```

---

## Frontend Architecture (Angular `school-hub`)

```
projects/school-hub/src/app/
└── it-inventory/
    ├── it-inventory.routes.ts
    ├── models/
    │   └── inventory.model.ts
    ├── services/
    │   ├── inventory.service.ts
    │   └── checkout.service.ts
    ├── pages/
    │   ├── dashboard/
    │   │   └── inventory-dashboard.component.ts/.html/.scss
    │   ├── item-list/
    │   │   └── item-list.component.ts/.html/.scss
    │   ├── item-detail/
    │   │   └── item-detail.component.ts/.html/.scss
    │   ├── item-form/
    │   │   └── item-form.component.ts/.html/.scss
    │   ├── checkout-form/
    │   │   └── checkout-form.component.ts/.html/.scss
    │   └── reports/
    │       └── reports.component.ts/.html/.scss
    └── components/
        ├── asset-card/
        ├── status-badge/
        └── condition-badge/
```

---

## Backend Architecture (Cloud Functions)

New router: `backend/src/routers/it-inventory-router.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List all items (with filters) |
| POST | `/inventory` | Create a new item |
| GET | `/inventory/:id` | Get item details |
| PUT | `/inventory/:id` | Update an item |
| DELETE | `/inventory/:id` | Archive (soft delete) an item |
| GET | `/inventory/:id/checkouts` | Checkout history for an item |
| POST | `/inventory/:id/checkout` | Check out an item |
| POST | `/inventory/:id/checkin` | Check in an item |
| GET | `/inventory/:id/audit` | Audit log for an item |
| GET | `/inventory/reports/:type` | Generate a named report |

---

## Firestore Collections

```
organizations/{orgId}/
  departments/{deptId}/
    inventoryItems/{itemId}
    checkoutRecords/{recordId}
    inventoryAuditLog/{entryId}
```

---

## Phased Delivery

### Phase 1 — Core Inventory
- Asset data model and Firestore collections
- CRUD endpoints + IT Inventory router
- Item list page with search/filter
- Item detail page
- Add/edit item form

### Phase 2 — Check-Out / Check-In
- Checkout and check-in API endpoints
- Checkout form with student search and permitting teacher field
- Return (check-in) form
- Overdue items view on dashboard

### Phase 3 — Audit & Dashboard
- Audit log endpoints and UI
- Dashboard summary cards

### Phase 4 — Reports
- CSV export for all report types
- Print-friendly report views

### Phase 5 — Polish
- Low stock alerts and consumables tracking
- Warranty expiration warnings
- Role-based UI (hide write actions for read-only users)

---

## Dependencies to Add

### Frontend
- No new dependencies required

### Backend
- No new dependencies required beyond existing Firebase Admin SDK

---

## Resolved Decisions

1. **Asset scope** — Assets are scoped per department within an organization.
2. **Student integration** — Checkouts can be linked to existing student records; students are looked up from the existing roster. Students may perform checkouts themselves; the permitting teacher's name is recorded on the checkout record but no teacher action is required in the system.
3. **Notifications** — No email notifications.
4. **QR codes** — Not included; asset lookup is done manually via search.
