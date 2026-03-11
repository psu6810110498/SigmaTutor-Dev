-- Update any remaining INSTRUCTOR users to USER
UPDATE "User" SET role = 'USER' WHERE role = 'INSTRUCTOR';

-- Remove INSTRUCTOR from Role enum
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "Role_old";
