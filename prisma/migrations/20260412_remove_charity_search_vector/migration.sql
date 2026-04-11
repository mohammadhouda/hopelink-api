-- Drop GIN index on CharityAccount.search_vector
DROP INDEX IF EXISTS "idx_charity_search";

-- Drop search_vector column from CharityAccount
ALTER TABLE "CharityAccount" DROP COLUMN IF EXISTS "search_vector";
