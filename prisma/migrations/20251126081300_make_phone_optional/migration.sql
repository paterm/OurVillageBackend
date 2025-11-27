-- AlterTable
-- Make phone optional in users table
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
-- Make userId optional in pending_verifications table
ALTER TABLE "pending_verifications" ALTER COLUMN "userId" DROP NOT NULL;

-- DropForeignKey (if exists, will fail silently if constraint doesn't exist)
-- We need to drop the foreign key constraint first, then recreate it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pending_verifications_userId_fkey'
    ) THEN
        ALTER TABLE "pending_verifications" DROP CONSTRAINT "pending_verifications_userId_fkey";
    END IF;
END $$;

-- AddForeignKey with ON DELETE SET NULL since userId can be null now
ALTER TABLE "pending_verifications" ADD CONSTRAINT "pending_verifications_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


