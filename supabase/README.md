# ProgramFinder Supabase Setup

This folder captures the first backend drop for ProgramFinder.

Files:
- `migrations/202604050001_programfinder_schema.sql`: core database schema based on the updated ProgramFinder design.
- `seed.sql`: starter reference data for Bulacan municipalities, program categories, and sectors.

Apply the schema:
1. Open the Supabase SQL Editor for your project and run `migrations/202604050001_programfinder_schema.sql`.
2. Run `seed.sql` after the schema succeeds.

If you prefer the Supabase CLI, keep these files in the repo and run your usual migration flow after linking the project.

Environment variables:
- Set `REACT_APP_SUPABASE_URL` in a local env file, for example `.env.local`.
- Set `REACT_APP_SUPABASE_ANON_KEY` in the same local env file.
- Do not place a Supabase service-role key or secret key in any `REACT_APP_*` variable because CRA exposes those values to the browser bundle.

Current frontend status:
- Runtime demo data has been removed from the frontend.
- Authentication, reference locations, offices, and staff profile records are expected to come from Supabase.
- Remaining feature modules should be backed by Supabase tables/functions before they are treated as persistent workflows.

Recommended next backend migrations:
- RLS policies for applicants and office staff.
- Trigger-based `program_budgets` recalculation from `budget_transactions`.
- Application status history automation.
- Storage bucket policies for applicant, program, budget, office, and announcement documents.
