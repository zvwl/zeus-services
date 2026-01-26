# Admin Service Management System

The admin service management system has been successfully implemented! This allows admins to add, edit, and delete services directly from the admin panel without needing to modify code.

## What Changed

### 1. **Database Migration** 
A new `services` table was created in Supabase with the following structure:
- `id` (uuid): Unique service identifier
- `name` (text): Service name (e.g., "50 Modded Cars")
- `price` (numeric): Service price in GBP
- `description` (text): Short description
- `icon` (text): Emoji or text icon
- `platforms` (jsonb): Array of available platforms
- `details` (jsonb): Array of detail strings
- `active` (boolean): Whether the service is visible to customers
- `created_at`, `updated_at`: Timestamps

### 2. **New Admin Page**
- **Location**: `/admin/services`
- **File**: `src/pages/AdminServicesPage.jsx`
- **Features**:
  - View all services in a card-based layout
  - Create new services with a form
  - Edit existing services
  - Delete services with confirmation
  - Add/remove platforms as comma-separated list
  - Add/remove details as bullet points
  - Toggle service active status

### 3. **Updated App Component**
- Services now load from the database instead of being hardcoded
- Only active services are displayed to customers
- Services data updates when the admin modifies them

### 4. **Updated Navigation**
- Added "Manage Services" link in the admin menu (UserMenu.jsx)
- Link appears only for admin users
- Easy access alongside "Manage Orders" and "Activity Logs"

## Setup Instructions

### Step 1: Deploy the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire content from `ADMIN_SERVICES_SETUP.md`
5. Paste it into the SQL editor
6. Click **Execute**
7. Verify the table was created (you should see a result from the test query at the bottom)

### Step 2: Initialize Services Data (Optional)

If you want to pre-populate your services in the database, you can insert them using this SQL:

```sql
-- Insert initial services
INSERT INTO public.services (name, price, description, icon, platforms, details, active) VALUES
(
  '50 Modded Cars',
  3.00,
  'Get 50 fully customized modded vehicles added to your account. Delivered manually within 30 minutes to 12 hours.',
  '🚗',
  '["Steam", "Epic Games", "Xbox App", "Rockstar Launcher"]'::jsonb,
  '[
    "📌 You must already own GTA V / GTA Online before purchasing",
    "💥 What''s Included:",
    "  🚗 50 Modded Cars of your choice",
    "⏱️ Delivery:",
    "  ✅ Completed within 30 minutes to 12 hours",
    "  🔑 Login access required",
    "  💬 We''ll contact you via Discord with full instructions"
  ]'::jsonb,
  true
);
```

### Step 3: Test the Feature

1. Log in with your admin account
2. Open the menu (☰)
3. Click "Manage Services" in the Admin section
4. You should see:
   - A list of existing services (if you added any in Step 2)
   - A "+ Add New Service" button
   - Edit and Delete buttons for each service

## How to Use

### Adding a Service
1. Click **+ Add New Service** button
2. Fill in the required fields:
   - **Service Name**: e.g., "50 Modded Cars"
   - **Price (GBP)**: e.g., 3.00
3. Optionally fill in:
   - **Description**: Short overview
   - **Icon**: Single emoji (e.g., 🚗)
   - **Platforms**: Add available platforms (e.g., Steam, Epic Games)
   - **Details**: Add feature points one per line
   - **Active**: Check to make visible, uncheck to hide
4. Click **Create Service**

### Editing a Service
1. Find the service in the list
2. Click the **Edit** button
3. Modify any field
4. Click **Update Service**

### Deleting a Service
1. Find the service in the list
2. Click the **Delete** button
3. Confirm the deletion
4. The service is immediately removed

## API Integration

The AdminServicesPage automatically handles all Supabase interactions:
- **Fetch**: Retrieves all services on page load
- **Create**: Inserts new service with `INSERT`
- **Update**: Modifies existing service with `UPDATE`
- **Delete**: Removes service with `DELETE`

All operations use RLS (Row Level Security) to ensure only admins can modify services.

## Data Structure Example

Here's what a service looks like in the database:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "50 Modded Cars",
  "price": 3.00,
  "description": "Get 50 fully customized modded vehicles...",
  "icon": "🚗",
  "platforms": ["Steam", "Epic Games", "Xbox App", "Rockstar Launcher"],
  "details": [
    "📌 You must already own GTA V...",
    "💥 What's Included:",
    "  🚗 50 Modded Cars of your choice"
  ],
  "active": true,
  "created_at": "2025-01-27T10:30:00.000Z",
  "updated_at": "2025-01-27T10:35:00.000Z"
}
```

## Troubleshooting

**Problem**: Admin services page shows "Failed to load services" error

**Solutions**:
- Ensure the services table exists (run the migration again)
- Check RLS policies are correctly applied
- Verify your admin status (run: `SELECT * FROM admin_users WHERE user_id = 'your-user-id'`)
- Check browser console for detailed errors

**Problem**: Can't create/edit/delete services

**Solutions**:
- Verify you're logged in with an admin account
- Check that `active = true` in the `admin_users` table for your user
- The RLS policy requires you to be in the `admin_users` table as active

**Problem**: Services don't appear on the shop page

**Solutions**:
- Ensure service `active = true` in the database
- Refresh the homepage (services are loaded on app startup)
- Check the browser console for fetch errors

## Files Modified

1. **src/App.jsx**
   - Added services state managed by database fetch
   - Removed hardcoded services array
   - Added `/admin/services` route

2. **src/pages/AdminServicesPage.jsx** (NEW)
   - Complete admin UI for service management
   - Form handling for create/edit/delete
   - Platform and details array management

3. **src/components/UserMenu.jsx**
   - Added "Manage Services" navigation link for admins

4. **supabase/migrations/20260127_create_services_table.sql** (NEW)
   - Database schema and RLS policies

## Next Steps

1. Deploy the migration to Supabase
2. Test creating a service in the admin panel
3. Verify the service appears on the Services page
4. Delete test services if needed
5. Add your real services through the admin UI

Enjoy your new admin service management system! 🎉
