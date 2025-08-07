# Database (`db/`) Documentation

The `db/` directory contains SQL migration files managed by Drizzle ORM. These files define the database schema, including tables, types, and relationships.

## File Structure

```
db/
├── 0000_tearful_iron_lad.sql    # Initial schema creation
├── 0001_wide_vermin.sql         # Adds responsible_id to companies table
├── 0002_smooth_sheva_callister.sql # Updates years table and compensation_view
├── 0003_light_avengers.sql      # Adds gmail_refresh_token to users table
├── 0004_lowly_wendell_vaughn.sql # Adds reminders table and links to logs and companies
├── 0005_short_ogun.sql          # Adds working_category, manual_consultation, declined_agreement, wave, and info_verified to companies table
├── 0006_wooden_emma_frost.sql   # Adds new_agreement_date_sent and document_date_sent, invoice_info_sent and drops new_agreement_sent and document_sent
└── meta/                        # Drizzle meta files
```

## Migration Files

The numbered SQL files represent database migrations, applied in sequential order. Each file contains SQL statements to modify the database schema.

- [`db/0000_tearful_iron_lad.sql`](db/0000_tearful_iron_lad.sql): This is the initial migration file. It creates the core tables for the CRM system, including `agreements`, `companies`, `general_information`, `initial_consultations`, `invoicing`, `logs`, `recurring_consultations`, `reporting`, `responsibles`, `sessions`, `statuses`, `users`, and `years`. It also defines the `agreement_type` enum and sets up foreign key constraints. A materialized view `compensation_view` is also created to calculate compensation details.
- [`db/0001_wide_vermin.sql`](db/0001_wide_vermin.sql): Adds a `responsible_id` column to the `companies` table, linking it to the `authentication.users` table.
- [`db/0002_smooth_sheva_callister.sql`](db/0002_smooth_sheva_callister.sql): Drops and recreates the `compensation_view`. It also alters the `years` table to change the data type of `addition_1`, `addition_2`, and `addition_3` columns to numeric and updates their default values.
- [`db/0003_light_avengers.sql`](db/0003_light_avengers.sql): Adds a `gmail_refresh_token` column to the `authentication.users` table.
- [`db/0004_lowly_wendell_vaughn.sql`](db/0004_lowly_wendell_vaughn.sql): Creates a `reminders` table and adds a `reminder_id` column to the `logs` table, establishing foreign key relationships.
- [`db/0005_short_ogun.sql`](db/0005_short_ogun.sql): Defines a `working_category` enum and adds several new columns (`manual_consultation`, `declined_agreement`, `working_category`, `wave`, `info_verified`) to the `companies` table.
- [`db/0006_wooden_emma_frost.sql`](db/0006_wooden_emma_frost.sql): Adds `new_agreement_date_sent`, `document_date_sent`, and `invoice_info_sent` columns to the `agreements`, `initial_consultations`, and `invoicing` tables respectively. It also drops the `new_agreement_sent` and `document_sent` columns from the `agreements` and `initial_consultations` tables.

## Technologies Used

- **Drizzle ORM**: Used for schema definition and migrations.
- **PostgreSQL**: The database system for which these SQL migrations are written.
