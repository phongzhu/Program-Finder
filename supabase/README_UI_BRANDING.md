Supabase UI Branding setup
==========================

This project uses a Supabase storage bucket and a `ui_settings` table to store global UI branding (colors, fonts, logo).

What to do in Supabase Console
-------------------------------

1. Create a storage bucket named `programfinder-logos`.
   - Go to Storage → Buckets → New bucket.
   - Set the bucket ID to `programfinder-logos`.
   - Choose `Public` if you want uploaded logos to be accessible via `getPublicUrl()`.
   - If you prefer private buckets, configure signed URLs and update the frontend to fetch signed URLs.

2. Run the SQL migration in the SQL editor or via the Supabase CLI
   - The migration file is available at `supabase/migrations/202604280001_create_ui_settings.sql`.
   - This creates the `public.ui_settings` table and a `set_updated_at()` trigger.

3. (Optional) Configure Row Level Security (RLS)
   - If your policy requires it, create policies that allow admins to read/write `ui_settings` and restrict general users.

4. Test the admin `System Branding` screen
   - In the app, go to the Admin → System Branding screen.
   - Upload a logo and save branding. Confirm the `programfinder-logos` bucket receives the object and the frontend shows the updated logo.

Notes
-----
- If `set_updated_at()` already exists in your DB, the migration will replace it. That's safe.
- Supabase CLI can be used to apply migrations as part of CI/CD. See Supabase docs for `supabase migrations`.
