CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'COMPANY');
CREATE TYPE "IdentificationType" AS ENUM ('CEDULA', 'RUC', 'PASSPORT', 'OTHER');

CREATE TABLE "customers" (
  "id" UUID PRIMARY KEY,
  "customer_type" "CustomerType" NOT NULL,
  "identification_type" "IdentificationType" NOT NULL,
  "identification" VARCHAR(20) NOT NULL,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "business_name" VARCHAR(180),
  "email" VARCHAR(180),
  "phone" VARCHAR(20),
  "secondary_phone" VARCHAR(20),
  "address" VARCHAR(255),
  "city" VARCHAR(100),
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "updated_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "customers_identification_active_key" ON "customers"("identification") WHERE "deleted_at" IS NULL;
CREATE INDEX "customers_customer_type_idx" ON "customers"("customer_type");
CREATE INDEX "customers_identification_type_idx" ON "customers"("identification_type");
CREATE INDEX "customers_is_active_idx" ON "customers"("is_active");
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");
