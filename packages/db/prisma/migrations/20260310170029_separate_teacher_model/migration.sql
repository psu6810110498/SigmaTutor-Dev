-- Step 1: Drop old FK and index (safe with IF EXISTS)
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_instructorId_fkey";
DROP INDEX IF EXISTS "courses_instructorId_idx";

-- Step 2: Create Teacher table (IF NOT EXISTS for idempotency)
CREATE TABLE IF NOT EXISTS "Teacher" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "title" TEXT,
    "nickname" TEXT,
    "phone" TEXT,
    "expertise" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "socialLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_email_key" ON "Teacher"("email");
CREATE INDEX IF NOT EXISTS "Teacher_email_idx" ON "Teacher"("email");

-- Step 3: Seed Teacher rows from User for each instructor linked to a course
INSERT INTO "Teacher" ("id", "email", "name", "profileImage", "createdAt", "updatedAt")
SELECT DISTINCT u."id", u."email", u."name", u."profileImage", u."createdAt", u."updatedAt"
FROM "User" u
JOIN courses c ON c."instructorId" = u."id"
ON CONFLICT ("id") DO NOTHING;

-- Step 3b: Copy extra instructor columns from User if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='bio') THEN
        UPDATE "Teacher" t SET "bio" = u."bio" FROM "User" u WHERE t."id" = u."id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='title') THEN
        UPDATE "Teacher" t SET "title" = u."title" FROM "User" u WHERE t."id" = u."id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='nickname') THEN
        UPDATE "Teacher" t SET "nickname" = u."nickname" FROM "User" u WHERE t."id" = u."id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='expertise') THEN
        UPDATE "Teacher" t SET "expertise" = u."expertise" FROM "User" u WHERE t."id" = u."id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='education') THEN
        UPDATE "Teacher" t SET "education" = u."education" FROM "User" u WHERE t."id" = u."id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='experience') THEN
        UPDATE "Teacher" t SET "experience" = u."experience" FROM "User" u WHERE t."id" = u."id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='socialLink') THEN
        UPDATE "Teacher" t SET "socialLink" = u."socialLink" FROM "User" u WHERE t."id" = u."id";
    END IF;
END $$;

-- Step 4: Drop instructor-specific columns from User (all IF EXISTS)
ALTER TABLE "User"
    DROP COLUMN IF EXISTS "bio",
    DROP COLUMN IF EXISTS "education",
    DROP COLUMN IF EXISTS "experience",
    DROP COLUMN IF EXISTS "expertise",
    DROP COLUMN IF EXISTS "nickname",
    DROP COLUMN IF EXISTS "socialLink",
    DROP COLUMN IF EXISTS "title";

-- Step 5: Add teacherId as nullable first (safe if column already exists)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "teacherId" TEXT;

-- Step 6: Copy instructorId -> teacherId
UPDATE "courses" SET "teacherId" = "instructorId" WHERE "teacherId" IS NULL AND "instructorId" IS NOT NULL;

-- Step 7: Enforce NOT NULL
ALTER TABLE "courses" ALTER COLUMN "teacherId" SET NOT NULL;

-- Step 8: Drop old instructorId
ALTER TABLE "courses" DROP COLUMN IF EXISTS "instructorId";

-- Step 9: Create new index and FK
CREATE INDEX IF NOT EXISTS "courses_teacherId_idx" ON "courses"("teacherId");
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
