# Reviews System Implementation Guide

## Overview
A comprehensive customer review system has been implemented for Zeus Services. This allows customers to rate and review their completed orders, and admins can moderate these reviews before they appear publicly.

## Features

### For Customers
- **Write Reviews**: Customers can submit reviews for completed orders
- **Star Rating**: 1-5 star rating system with descriptive labels
- **Text Comments**: Detailed feedback (10-2000 characters)
- **Order Verification**: Reviews are tied to actual verified purchases
- **Public Display**: Approved reviews are visible on the public Reviews page

### For Administrators
- **Review Moderation**: Approve, reject, or mark reviews as pending
- **Admin Notes**: Add internal notes to reviews
- **Filtering**: Filter reviews by status (pending, approved, rejected)
- **Delete Reviews**: Remove inappropriate reviews
- **Full Management**: Access via Admin menu in the user panel

## Database Schema

### Reviews Table
```sql
- id (UUID, primary key)
- order_id (UUID, foreign key to orders.id)
- user_id (UUID, foreign key to auth.users.id)
- rating (INTEGER, 1-5)
- comment (TEXT, 10-2000 characters)
- status (VARCHAR, 'pending'|'approved'|'rejected')
- admin_notes (TEXT, optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Orders Table Updates
- Added `review_eligible` (BOOLEAN) column
- Automatically set to `true` when order status changes to 'completed'

## User Flow

### 1. Customer Places Order
- Customer completes checkout and payment
- Order is created with initial status

### 2. Admin Processes Order
- Admin changes order status to 'completed' in Admin Orders page
- `review_eligible` flag is automatically set to `true` via database trigger

### 3. Customer Writes Review
- Customer visits "My Orders" page
- Sees "Write a Review" button for completed orders
- Clicks button and is redirected to review form
- Fills out rating (1-5 stars) and comment
- Submits review with status 'pending'

### 4. Admin Moderates Review
- Admin visits "Manage Reviews" from Admin menu
- Reviews pending reviews
- Can:
  - Approve: Makes review publicly visible
  - Reject: Hides review from public view
  - Add admin notes for internal tracking
  - Delete: Permanently removes review

### 5. Public Display
- Approved reviews appear on `/reviews` page
- Shows star ratings, comments, and verified purchase badge
- Includes filtering by rating and sorting options
- Displays aggregate statistics (average rating, distribution)

## Files Created/Modified

### New Files
```
src/pages/ReviewForm.jsx          - User review submission form
src/pages/ReviewForm.css          - Styling for review form
src/pages/ReviewsPage.jsx         - Public reviews display
src/pages/ReviewsPage.css         - Styling for reviews page
src/pages/AdminReviewsPage.jsx    - Admin review management
src/pages/AdminReviewsPage.css    - Styling for admin reviews
supabase/migrations/20260128_create_reviews_system.sql  - Database migration
```

### Modified Files
```
src/App.jsx                       - Added routes for reviews
src/pages/OrdersPage.jsx          - Added review buttons for completed orders
src/pages/OrdersPage.css          - Added review button styles
src/components/Header.jsx         - Added Reviews link to navigation
src/components/UserMenu.jsx       - Added Reviews to Browse and Admin sections
```

## Routes

### Public Routes
- `/reviews` - View all approved reviews
- `/review?order=<order_id>` - Submit review for specific order (requires auth)

### Admin Routes
- `/admin/reviews` - Manage and moderate reviews (requires admin)

## Security

### Row Level Security (RLS) Policies
1. **Public Read**: Anyone can view approved reviews
2. **User Read**: Users can view their own reviews (any status)
3. **User Insert**: Users can only create reviews for their own completed orders
4. **User Update**: Users can only update their own pending reviews
5. **Admin Full Access**: Admins can view, update, and delete all reviews

### Validation
- Rating: Must be between 1-5
- Comment: Must be 10-2000 characters
- Order Verification: Review must be for user's own completed order
- One Review Per Order: Enforced by unique constraint

## Setup Instructions

### 1. Apply Database Migration
Run the SQL migration file in your Supabase SQL Editor:
```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy and paste the contents of:
supabase/migrations/20260128_create_reviews_system.sql
# Execute the query
```

Or if you have Supabase CLI installed:
```bash
supabase db push
```

### 2. Verify Tables Created
Check that the following exist in your database:
- `reviews` table with all columns
- RLS policies on `reviews` table
- `review_eligible` column on `orders` table
- `set_review_eligible()` trigger function
- Trigger on orders table

### 3. Test the System

#### As a Customer:
1. Place an order (or use an existing order)
2. Have admin mark the order as 'completed'
3. Visit "My Orders" page
4. Click "Write a Review" button
5. Submit a review
6. Verify "Review Submitted" message appears

#### As an Admin:
1. Navigate to Admin menu → "Manage Reviews"
2. See pending review
3. Add admin notes (optional)
4. Click "Approve" to make it public
5. Visit `/reviews` page as regular user
6. Verify review is displayed publicly

## Styling

The reviews system follows the existing Zeus Services design language:
- **Colors**: 
  - Primary: #fbbf24 (gold)
  - Background: Dark blue gradients
  - Success: #22c55e
  - Error: #ef4444
  - Text: #f1f5f9
- **Typography**: Inter font family
- **Components**: Consistent card-based layout with hover effects
- **Responsive**: Mobile-friendly with adaptive layouts

## Additional Features

### Statistics Display
The public reviews page shows:
- Average rating (calculated from all reviews)
- Total review count
- Rating distribution bar chart (5-star to 1-star breakdown)

### Filtering & Sorting
Users can:
- Filter by specific star rating
- Sort by: Newest, Oldest, Highest Rating, Lowest Rating

### Admin Notes
- Internal tracking of moderation decisions
- Visible only to admins
- Can be updated when changing review status

## Future Enhancements (Optional)

Potential features to add:
- Email notifications when review is approved/rejected
- Customer replies to reviews
- Review helpfulness voting
- Photo/media uploads with reviews
- Review editing by customers (before approval)
- Bulk approve/reject actions for admins
- Export reviews to CSV
- Review analytics dashboard

## Troubleshooting

### Review Button Not Showing
- Verify order status is 'completed'
- Check `review_eligible` flag is true in database
- Ensure user owns the order

### Can't Submit Review
- Verify order is completed and belongs to user
- Check if review already exists for this order
- Ensure comment meets length requirements (10-2000 chars)

### Reviews Not Appearing Publicly
- Check review status is 'approved' in admin panel
- Verify RLS policies are properly set up
- Check browser console for errors

### Admin Can't See Reviews
- Verify user is in `admin_users` table with `active = true`
- Check admin route protection is working
- Verify RLS policies allow admin access

## Support
For issues or questions, contact the development team or check the project documentation.
