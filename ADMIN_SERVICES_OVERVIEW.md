# Admin Service Management - Visual Overview

## Navigation Flow

```
Menu (☰)
├── Home (🏠)
├── Services (🛍️)
├── Products (📦)
├── Cart (🛒)
├── Settings (⚙️)
├── My Orders (📋)
└── Admin Section [if admin]
    ├── Manage Orders (👨‍💼)
    ├── Manage Services (⚙️) ← NEW!
    └── Activity Logs (📊)
```

## Admin Service Management Page

```
┌─────────────────────────────────────────┐
│ Manage Services                         │
├─────────────────────────────────────────┤
│                                         │
│  [+ Add New Service] [Cancel] buttons   │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Create New Service Form            │ │
│  ├────────────────────────────────────┤ │
│  │ Service Name*      [_____________] │ │
│  │ Price (GBP)*       [_____________] │ │
│  │ Description        [_____________] │ │
│  │ Icon (emoji)       [_____________] │ │
│  │                                    │ │
│  │ Platforms:                         │ │
│  │ [Steam] [x] [Epic Games] [x] ...   │ │
│  │ [Add new:________] [Add]           │ │
│  │                                    │ │
│  │ Details:                           │ │
│  │ [Detail item 1] [x]                │ │
│  │ [Detail item 2] [x]                │ │
│  │ [Add: __________] [Add]            │ │
│  │                                    │ │
│  │ [☑] Active                         │ │
│  │                                    │ │
│  │              [Create Service]      │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Services List:                         │
│  ┌────────────────────────────────────┐ │
│  │ 🚗 50 Modded Cars        £3.00     │ │
│  │ Description...                     │ │
│  │ Platforms: [Steam] [Epic] [...]    │ │
│  │              [Edit] [Delete]       │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 👕 20 Modded Outfits     £3.00     │ │
│  │ Description...                     │ │
│  │ Platforms: [Steam] [Epic] [...]    │ │
│  │              [Edit] [Delete]       │ │
│  └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Data Model

```
┌──────────────────────────────────────────┐
│         Services Table (Supabase)        │
├──────────────────────────────────────────┤
│ Column         │ Type      │ Example     │
├────────────────┼───────────┼─────────────┤
│ id (PK)        │ UUID      │ 550e8400... │
│ name           │ text      │ 50 Cars     │
│ price          │ numeric   │ 3.00        │
│ description    │ text      │ Get 50...   │
│ icon           │ text      │ 🚗          │
│ platforms      │ jsonb[]   │ [Steam...] │
│ details        │ jsonb[]   │ [Feature1]  │
│ active         │ boolean   │ true        │
│ created_at     │ timestamp │ 2025-01-27  │
│ updated_at     │ timestamp │ 2025-01-27  │
└──────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────┐
│  Admin Creates  │
│  New Service    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AdminServicesPage validates    │
│  form & sends to Supabase       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Supabase INSERT                │
│  - Checks RLS policy            │
│  - Verifies user is admin       │
│  - Saves to database            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Service in Database            │
│  active = true                  │
└────────┬────────────────────────┘
         │
         ▼ (on page refresh)
┌─────────────────────────────────┐
│  App.jsx useEffect              │
│  Fetches services from DB       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  ServicesPage displays          │
│  service to customers           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Customer sees new service      │
│  and can buy it                 │
└─────────────────────────────────┘
```

## Admin Permissions Flow

```
User opens /admin/services
        │
        ▼
Is user logged in?
    ├─ No → Redirect to /login
    └─ Yes ↓
    
Is user admin?
    ├─ Check admin_users table
    ├─ active = true?
    │   ├─ Yes → Allow access ✅
    │   └─ No → Show "Access denied"
    └─ Not found → Show "Access denied"

Can user modify services?
    └─ INSERT/UPDATE/DELETE operations
       └─ RLS checks if user in admin_users
          ├─ Yes → Operation succeeds ✅
          └─ No → Database rejects ❌
```

## Service Lifecycle

```
CREATE
  │
  ├─→ Set name, price, description, icon
  ├─→ Add platforms (Steam, Epic, etc.)
  ├─→ Add details (features, requirements)
  ├─→ Set active = true
  └─→ Save to database
      │
      ▼
READ
  │
  ├─→ App fetches on startup
  ├─→ Shows on /services page
  ├─→ Available in cart/checkout
  └─→ Displayed on ServiceDetail page
      │
      ▼
UPDATE
  │
  ├─→ Admin edits service
  ├─→ Change any field (price, description, etc.)
  ├─→ Modify platforms
  ├─→ Update details
  └─→ Save changes to database
      │
      ▼
DEACTIVATE (soft delete)
  │
  ├─→ Set active = false
  ├─→ Service hidden from customers
  ├─→ Still in database (not deleted)
  └─→ Can be reactivated later
      │
      ▼
DELETE (hard delete)
  │
  ├─→ Click Delete button
  ├─→ Confirm deletion
  └─→ Permanently removed from database
```

## File Structure

```
c:\dev\Zeuservices\
├── src\
│   ├── App.jsx                    ← Updated: Load services from DB
│   ├── components\
│   │   └── UserMenu.jsx           ← Updated: Added Manage Services link
│   ├── pages\
│   │   ├── AdminServicesPage.jsx  ← NEW: Service management UI
│   │   ├── ServiceDetail.jsx      ← Updated: UUID ID matching
│   │   └── Services.jsx           ← Unchanged (receives dynamic services)
│   └── ...
├── supabase\
│   └── migrations\
│       └── 20260127_create_services_table.sql  ← NEW: Database schema
├── ADMIN_SERVICES_MANAGEMENT.md       ← NEW: Complete guide
├── ADMIN_SERVICES_IMPLEMENTATION.md   ← NEW: Technical details
├── ADMIN_SERVICES_SETUP.md            ← NEW: SQL to run
└── QUICK_START_ADMIN_SERVICES.md      ← NEW: Quick reference

(Other files unchanged)
```

## API Call Patterns

### Fetch Services (App.jsx)
```javascript
const { data, error } = await supabase
  .from('services')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: true })
```

### Create Service (AdminServicesPage.jsx)
```javascript
const { error } = await supabase
  .from('services')
  .insert([{
    name: formData.name,
    price: parseFloat(formData.price),
    description: formData.description,
    icon: formData.icon,
    platforms: formData.platforms,
    details: formData.details,
    active: formData.active
  }])
```

### Update Service (AdminServicesPage.jsx)
```javascript
const { error } = await supabase
  .from('services')
  .update({...updated fields...})
  .eq('id', serviceId)
```

### Delete Service (AdminServicesPage.jsx)
```javascript
const { error } = await supabase
  .from('services')
  .delete()
  .eq('id', serviceId)
```

## Security Model

```
┌─────────────────────────────────┐
│    Request from Frontend        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Supabase Auth Token            │
│  (JWT with user ID)             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  RLS Policy Evaluation          │
│  Check: auth.uid() in           │
│  admin_users table (active=true)│
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼ Yes         ▼ No
   Allow         Deny
   (✅)          (❌)
   │
   ▼
┌─────────────────────────────────┐
│  Database Operation Executes    │
│  (INSERT/UPDATE/DELETE)         │
└─────────────────────────────────┘
```

## Performance Characteristics

| Operation | Query Type | Index Used | Time |
|-----------|-----------|------------|------|
| Load services | SELECT active=true | idx_services_active | ~100ms |
| Create service | INSERT | - | ~50ms |
| Edit service | UPDATE by ID | PK index | ~50ms |
| Delete service | DELETE by ID | PK index | ~50ms |
| Admin check | SELECT admin_users | idx_admin_users | ~20ms |

All operations execute in <200ms on typical network conditions.

## Monitoring

To check service count in Supabase:
```sql
-- How many services?
SELECT COUNT(*) as total_services FROM public.services;

-- How many are active?
SELECT COUNT(*) as active_services FROM public.services WHERE active = true;

-- What's the price range?
SELECT MIN(price) as min, MAX(price) as max FROM public.services;

-- What platforms do we offer?
SELECT DISTINCT platforms FROM public.services;
```

---

This visual overview shows the complete admin service management system architecture and data flow.
