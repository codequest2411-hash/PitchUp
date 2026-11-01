-- English is the default site language; only affects newly created rows.
ALTER TABLE "Call" ALTER COLUMN "locale" SET DEFAULT 'en';
ALTER TABLE "User" ALTER COLUMN "locale" SET DEFAULT 'en';
