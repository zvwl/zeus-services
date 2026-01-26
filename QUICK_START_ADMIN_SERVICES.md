# Quick Start: Admin Service Management

## 5-Minute Setup

### Step 1: Deploy Database (2 minutes)
1. Open Supabase → Your Project → SQL Editor
2. Click **New Query**
3. Paste the SQL from `ADMIN_SERVICES_SETUP.md`
4. Click **Execute**
5. ✅ Done!

### Step 2: Test It Out (3 minutes)
1. Log in with your admin account
2. Click the menu (☰) button
3. Click **Manage Services**
4. Click **+ Add New Service**
5. Fill in the form:
   - Name: "Test Service"
   - Price: 9.99
   - Description: "A test service"
   - Icon: 🎉
6. Click **Create Service**
7. ✅ Service created!

### Step 3: See It Live
1. Go to `/services` page
2. You should see your new service
3. Click on it to view details
4. Add it to cart to test the flow

## Admin Features

| Feature | Location | Icon |
|---------|----------|------|
| Manage Services | Menu → Manage Services | ⚙️ |
| View All Services | Admin page shows full list | - |
| Add Service | Click "+ Add New Service" | + |
| Edit Service | Click "Edit" button on service card | ✏️ |
| Delete Service | Click "Delete" button on service card | 🗑️ |
| Toggle Active | Checkbox in form | ☑️ |

## Common Tasks

### Add a New Service
```
1. Click "+ Add New Service"
2. Fill form (name, price required)
3. Click "Create Service"
```

### Edit a Service
```
1. Click "Edit" on the service
2. Change any field
3. Click "Update Service"
```

### Remove a Service
```
1. Click "Delete" on the service
2. Confirm deletion
3. Service removed
```

### Add Multiple Platforms
```
1. In the form, enter a platform (e.g., "Steam")
2. Click "Add" or press Enter
3. The platform appears as a tag
4. Repeat for each platform
5. Click "Create Service"
```

### Add Service Details
```
1. In the details section, type a feature
2. Press Enter
3. The detail appears as an item
4. Repeat for each detail point
5. Click "Create Service"
```

## What Happens After You Create a Service?

✅ Service is stored in Supabase database
✅ Service appears in your admin list immediately
✅ Service appears on `/services` page after page refresh
✅ Customers can see and buy the service
✅ Service details are editable anytime
✅ Changes take effect after page refresh

## Troubleshooting

**❌ Can't see "Manage Services" link**
→ Make sure you're logged in with an admin account

**❌ See "Verifying admin access..." forever**
→ Refresh the page (admin check may have timed out)

**❌ "Failed to load services" error**
→ Run the SQL migration again in Supabase

**❌ Can't create/edit/delete**
→ Check admin status: You must be in `admin_users` table

**❌ Service doesn't appear after creating**
→ Refresh the Services page (not cached)

## Example Services to Add

### Gaming Services
```
Name: 100 Modded Cars
Price: 5.99
Icon: 🚗
Platforms: Steam, Epic Games, Xbox App
```

### Cosmetic Services
```
Name: Premium Skins Bundle
Price: 9.99
Icon: ✨
Platforms: Steam, Epic Games
```

### Currency Services
```
Name: Game Currency Pack
Price: 7.99
Icon: 💰
Platforms: Xbox App, Rockstar Launcher
```

## Database Info

**Table**: `public.services`
**Rows**: Number of active services
**Access**: Admins can modify, customers can view

To check in Supabase:
1. Go to SQL Editor
2. Run: `SELECT COUNT(*) FROM public.services;`
3. See how many services you have

## Need Help?

Check these files for more info:
- `ADMIN_SERVICES_MANAGEMENT.md` - Complete guide
- `ADMIN_SERVICES_IMPLEMENTATION.md` - Technical details
- `ADMIN_SERVICES_SETUP.md` - Database SQL

---

**You're all set!** 🎉

Your admin can now manage services without touching code. Services are dynamic, scalable, and fully under admin control.
