CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GAS', 'OTHER');
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'OTHER');

CREATE TABLE "vehicles" (
  "id" UUID PRIMARY KEY,
  "customer_id" UUID NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "plate" VARCHAR(10) NOT NULL,
  "vin" VARCHAR(30),
  "brand" VARCHAR(80) NOT NULL,
  "model" VARCHAR(80) NOT NULL,
  "year" INTEGER NOT NULL,
  "color" VARCHAR(60),
  "engine_number" VARCHAR(80),
  "chassis_number" VARCHAR(80),
  "fuel_type" "FuelType" NOT NULL,
  "transmission_type" "TransmissionType" NOT NULL,
  "mileage" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "updated_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "vehicles_plate_active_key" ON "vehicles"("plate") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "vehicles_vin_active_key" ON "vehicles"("vin") WHERE "deleted_at" IS NULL AND "vin" IS NOT NULL;
CREATE INDEX "vehicles_customer_id_idx" ON "vehicles"("customer_id");
CREATE INDEX "vehicles_brand_idx" ON "vehicles"("brand");
CREATE INDEX "vehicles_fuel_type_idx" ON "vehicles"("fuel_type");
CREATE INDEX "vehicles_transmission_type_idx" ON "vehicles"("transmission_type");
CREATE INDEX "vehicles_is_active_idx" ON "vehicles"("is_active");
CREATE INDEX "vehicles_deleted_at_idx" ON "vehicles"("deleted_at");
