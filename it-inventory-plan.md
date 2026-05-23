# IT Closet Inventory System — Plan

## Overview

A web-based inventory management tool for the school IT department. The primary purpose is tracking check-outs and check-ins of physical technology assets (devices, peripherals, cables, accessories). Assets are scoped per department for flexibility. Students may check items in and out themselves with a teacher's permission, which is recorded on the checkout. Built as one of the 10 school tools within the `school-hub` app.

---

## Core Features

### 1. Asset Registry — Serialized Items
- Individual, uniquely identified assets that are tracked one-by-one (laptops, tablets, monitors, etc.)
- Fields:
  - **Name** (e.g., "Lenovo Chromebook 14")
  - **Asset Tag** (required, unique per department)
  - **Serial Number**
  - **Category** (Laptop, Desktop, Monitor, Tablet, Printer, Network Equipment, etc.)
  - **Make / Model**
  - **Condition** (New, Good, Fair, Damaged, Broken)
  - **Status** (Available, Checked Out, Retired)
  - **Department**
  - **Location** (Room number, closet label, cart name)
  - **Purchase Date**
  - **Warranty Expiration Date**
  - **Cost**
  - **Notes / Tags**

### 2. Asset Registry — Consumables
- Bulk items tracked by quantity rather than individual identity (cables, batteries, cleaning kits, etc.)
- Fields:
  - **Name** (e.g., "USB-C Charging Cable")
  - **Category** (Cable, Accessory, Cleaning Supply, etc.)
  - **Department**
  - **Location**
  - **Quantity on Hand** (required)
  - **Minimum Quantity** (threshold for low-stock alert)
  - **Cost per Unit**
  - **Notes / Tags**
- No per-unit checkout — quantity is adjusted directly when items are given out or restocked
- Quantity adjustments use an **atomic server-side increment** (`FieldValue.increment()`) to prevent race conditions when multiple users adjust stock simultaneously

### 3. Check-Out / Check-In
- Check-out and check-in apply only to **serialized items** — consumable quantities are adjusted directly
- Any user (IT staff, teacher, or student) can initiate a checkout or return
- **Student self-checkout**: when a student checks out an item, the permitting teacher must be selected from the official staff roster and is stored on the record — the teacher does not need to interact with the system
- When assignee type is "student", search and select from the existing student roster — no manual name entry
- Record:
  - Assignee (student record link, or free-text name for staff/classroom)
  - Permitting teacher (required when the checkout is performed by a student; selected from the staff roster)
  - Date checked out
  - Expected return date
  - Condition at checkout
- Check-in flow records:
  - Date returned
  - Condition at return
  - Any damage notes
- View all currently checked-out items and overdue returns

### 4. Search & Filter
- Serialized items and consumables are browsed in separate views
- Full-text search across name, serial number, and asset tag (serialized); name and category (consumables)
- Filter serialized items by: category, status, condition, location, assignee
- Filter consumables by: category, location, low-stock
- Sort by any column

### 5. Inventory Dashboard
- Summary cards: Total Serialized Items, Checked Out, Consumables Low on Stock
- Recently added items
- Overdue check-outs (past expected return date)

### 6. Low Stock Alerts
- Dashboard alert when a consumable's quantity on hand falls below its minimum quantity threshold

### 7. Reports & Export
- Generate reports:
  - Full serialized inventory list
  - All currently checked-out items
  - Overdue items
  - Serialized items by condition
  - Consumables stock levels
- Export any report to **CSV**
- Print-friendly view

### 8. Audit Log
- Immutable log of every change to every asset:
  - Who made the change (logged-in user)
  - Timestamp
  - What changed (field, old value, new value)
  - Action type (Created, Updated, Checked Out, Checked In, Retired)

### 9. Role-Based Access
- **IT Admin** — full CRUD on all assets, can view audit log and all reports
- **IT Staff** — can check out/in, view inventory
- **Student / Teacher** — can check out and return items; student checkouts require a permitting teacher to be selected from the staff roster

---

## UI/UX Design

The interface prioritizes speed for the most common action: checking items in and out. All high-frequency forms are designed to be completable entirely via keyboard without touching the mouse.

### Checkout Form (`checkout-form.component`)

The checkout form is the most-used screen and is optimized for a fast, sequential keyboard flow:

1. **Asset Tag field** — auto-focused on component load. The user types or scans the asset tag.
2. After a valid tag is entered, the item's name, condition, and current status appear inline below the field as a confirmation badge. If the item is already checked out, an error is shown immediately and focus stays on the asset tag field.
3. **Enter** moves focus to the **Assignee Type** selector (Student / Staff / Classroom).
4. **Enter** from Assignee Type moves focus to the **Assignee search field**, which is a live typeahead backed by the student roster (if "Student") or a free-text input (if "Staff" or "Classroom").
5. If Assignee Type is "Student": **Enter** on a selected student moves focus to the **Permitting Teacher search field** — a live typeahead backed by the staff roster.
6. **Enter** from the permitting teacher selection moves focus to the **Expected Return Date** field.
7. **Enter** from the date field submits the form.

Additional checkout form behaviors:
- If the asset tag resolves to an item that is already checked out, the form offers a shortcut to jump directly to the **check-in flow** for that item.
- Submitting shows a brief success toast and resets the form, returning focus to the Asset Tag field — ready for the next transaction.
- All search/typeahead dropdowns can be navigated with arrow keys and confirmed with Enter; Escape dismisses without clearing the typed value.

### Check-In Form

- Accessible from the checkout form shortcut (when a checked-out item is scanned) or from the item detail page.
- Asset tag field is auto-focused.
- After a valid tag resolves, the current assignee and checkout date are shown inline.
- The user selects the **Condition at Return** from a compact segmented button group (keyboard-navigable).
- An optional **Damage Notes** textarea appears only if the selected condition is worse than the condition at checkout.
- **Enter** (or Tab → Enter) submits.

### Item List (`item-list.component`)

- The **search/filter bar** is auto-focused on page load.
- Typing immediately filters the list (debounced).
- **Arrow keys** navigate the result rows; **Enter** opens the focused row's detail page.
- Status and condition are shown as color-coded badges on each row for at-a-glance scanning.
- Items that are overdue on return are highlighted with a distinct row background.

### Consumable List (`consumable-list.component`)

- Consumables at or below their minimum quantity threshold are sorted to the top and flagged with a low-stock indicator.
- Each row has inline **+** / **−** quick-adjust buttons for common single-unit changes.
- For larger adjustments, clicking the quantity value opens a small inline input; **Enter** submits the delta.

### Item Detail Page (`item-detail.component`)

- Displays full item metadata, current checkout status, and checkout history in a timeline.
- A prominent **Check Out** / **Check In** button reflects the item's current status and links directly to the pre-filled checkout or check-in form.

### Dashboard (`inventory-dashboard.component`)

- Summary cards link to pre-filtered list views (e.g., "Checked Out" card navigates to the item list filtered to `status: checked-out`).
- Overdue items and low-stock consumables are surfaced as actionable lists, not just counts.

### General Patterns

- **Status badges** — color-coded consistently across all views: Available (green), Checked Out (blue), Retired (grey), Low Stock (amber).
- **Condition badges** — New (green), Good (teal), Fair (yellow), Damaged (orange), Broken (red).
- **Toast notifications** — non-blocking, appear bottom-right, auto-dismiss after 4 seconds. Errors persist until dismissed.
- **Destructive actions** (archive/retire) require a confirmation dialog before executing.
- **Forms** — all required fields are validated on submit, not on blur, to avoid interrupting fast keyboard entry.

---

## Data Model

### `InventoryItem` (serialized)
```typescript
interface InventoryItem {
  id: string;
  name: string;
  assetTag: string;            // unique per department
  serialNumber: string;
  category: SerializedCategory;
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
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  departmentId: string;        // used to scope queries within the org
}

type SerializedCategory =
  | 'laptop' | 'desktop' | 'tablet' | 'monitor'
  | 'printer' | 'network' | 'other';

type AssetCondition = 'new' | 'good' | 'fair' | 'damaged' | 'broken';
type AssetStatus = 'available' | 'checked-out' | 'retired';
```

### `Consumable` (bulk)
```typescript
interface Consumable {
  id: string;
  name: string;
  category: ConsumableCategory;
  location: string;
  quantityOnHand: number;
  minimumQuantity: number;     // triggers low-stock alert
  costPerUnit?: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  departmentId: string;        // used to scope queries within the org
}

type ConsumableCategory = 'cable' | 'accessory' | 'cleaning' | 'other';
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
  permittingTeacherId?: string;   // required when checkedOutBy is a student; links to staff roster
  permittingTeacherName?: string; // denormalized display name
  checkedInBy?: string;
  organizationId: string;
  departmentId: string;        // used to scope queries within the org
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
    │   ├── inventory-item.model.ts
    │   └── consumable.model.ts
    ├── services/
    │   ├── inventory-item.service.ts
    │   ├── consumable.service.ts
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
    │   ├── consumable-list/
    │   │   └── consumable-list.component.ts/.html/.scss
    │   ├── consumable-form/
    │   │   └── consumable-form.component.ts/.html/.scss
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
| GET | `/inventory` | List serialized items (with filters) |
| POST | `/inventory` | Create a serialized item |
| GET | `/inventory/:id` | Get serialized item details |
| PUT | `/inventory/:id` | Update a serialized item |
| DELETE | `/inventory/:id` | Archive a serialized item |
| GET | `/inventory/:id/checkouts` | Checkout history for an item |
| POST | `/inventory/:id/checkout` | Check out an item |
| POST | `/inventory/:id/checkin` | Check in an item |
| GET | `/inventory/:id/audit` | Audit log for an item |
| GET | `/consumables` | List consumables (with filters) |
| POST | `/consumables` | Create a consumable |
| GET | `/consumables/:id` | Get consumable details |
| PUT | `/consumables/:id` | Update a consumable's metadata (name, location, etc.) |
| POST | `/consumables/:id/adjust` | Atomically adjust quantity on hand (`delta`: positive = restock, negative = dispense) |
| DELETE | `/consumables/:id` | Archive a consumable |
| GET | `/inventory/reports/:type` | Generate a named report |

---

## Firestore Collections

```
organizations/{orgId}/
  inventoryItems/{itemId}      ← serialized, individually tracked; departmentId field for scoping
  consumables/{consumableId}   ← bulk, quantity-tracked; departmentId field for scoping
  checkoutRecords/{recordId}   ← only applies to inventoryItems; departmentId field for scoping
  inventoryAuditLog/{entryId}
```

---

## Phased Delivery

### Phase 1 — Core Inventory
- `InventoryItem` and `Consumable` data models and Firestore collections
- CRUD endpoints for both serialized items and consumables
- Serialized item list page with search/filter
- Serialized item detail and add/edit form
- Consumable list page and add/edit form

### Phase 2 — Check-Out / Check-In
- Checkout and check-in API endpoints
- Checkout form with student search and permitting teacher search/select (staff roster)
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
  - Quantity adjustments **must** use `FieldValue.increment(delta)` on the backend — never read-modify-write — to ensure correctness under concurrent updates
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
2. **Student integration** — Checkouts can be linked to existing student records; students are looked up from the existing roster. Students may perform checkouts themselves; the permitting teacher is selected from the staff roster and their identity is recorded on the checkout record, but no teacher action is required in the system.
3. **Notifications** — No email notifications.
4. **QR codes** — Not included; asset lookup is done manually via search.
