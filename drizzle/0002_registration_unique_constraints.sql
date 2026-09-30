-- ============================================================
-- Migration 0002: Add PARTIAL unique indexes for registrations
-- ============================================================
--
-- SAFETY: In Postgres, UNIQUE indexes with `WHERE col IS NOT NULL`
-- only enforce uniqueness for rows that HAVE a value. Multiple
-- pending registrations with NULL order_id/payment_id/bib_number
-- are still allowed. Only ASSIGNED values must be unique.
--
-- DUPLICATE AUDIT QUERIES — run THESE before applying the migration:
--
--   -- Duplicate non-null payment IDs (should be 0 rows)
--   SELECT payment_id, COUNT(*)
--   FROM registrations
--   WHERE payment_id IS NOT NULL
--   GROUP BY payment_id
--   HAVING COUNT(*) > 1;
--
--   -- Duplicate non-null order IDs (should be 0 rows)
--   SELECT order_id, COUNT(*)
--   FROM registrations
--   WHERE order_id IS NOT NULL
--   GROUP BY order_id
--   HAVING COUNT(*) > 1;
--
--   -- Duplicate non-null BIB numbers (should be 0 rows)
--   SELECT bib_number, COUNT(*)
--   FROM registrations
--   WHERE bib_number IS NOT NULL
--   GROUP BY bib_number
--   HAVING COUNT(*) > 1;
--
-- If duplicates are found: RESOLVE MANUALLY before applying.
-- DO NOT blindly DELETE production rows. Identify the canonical
-- ticket for each duplicate set and NULL out the non-canonical
-- columns (payment_id/order_id/bib_number + ticket_id as needed).

CREATE UNIQUE INDEX IF NOT EXISTS registrations_payment_id_unique_idx
  ON registrations (payment_id)
  WHERE payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_order_id_unique_idx
  ON registrations (order_id)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_bib_number_unique_idx
  ON registrations (bib_number)
  WHERE bib_number IS NOT NULL;