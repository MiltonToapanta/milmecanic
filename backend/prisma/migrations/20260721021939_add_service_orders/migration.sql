-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('RECEIVED', 'DIAGNOSIS', 'WAITING_APPROVAL', 'APPROVED', 'IN_REPAIR', 'QUALITY_CONTROL', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FuelLevel" AS ENUM ('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL');

-- CreateTable
CREATE TABLE "service_orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "appointment_id" UUID,
    "assigned_advisor_id" UUID,
    "assigned_mechanic_id" UUID,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "reported_mileage" INTEGER NOT NULL DEFAULT 0,
    "fuel_level" "FuelLevel" NOT NULL,
    "customer_request" TEXT NOT NULL,
    "initial_diagnosis" TEXT,
    "internal_notes" TEXT,
    "estimated_delivery_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "cancellation_reason" VARCHAR(250),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_counters" (
    "id" UUID NOT NULL,
    "prefix" VARCHAR(15) NOT NULL,
    "current_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "service_order_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_order_number_key" ON "service_orders"("order_number");

-- CreateIndex
CREATE INDEX "service_orders_customer_id_idx" ON "service_orders"("customer_id");

-- CreateIndex
CREATE INDEX "service_orders_vehicle_id_idx" ON "service_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "service_orders_appointment_id_idx" ON "service_orders"("appointment_id");

-- CreateIndex
CREATE INDEX "service_orders_assigned_advisor_id_idx" ON "service_orders"("assigned_advisor_id");

-- CreateIndex
CREATE INDEX "service_orders_assigned_mechanic_id_idx" ON "service_orders"("assigned_mechanic_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_created_at_idx" ON "service_orders"("created_at");

-- CreateIndex
CREATE INDEX "service_orders_deleted_at_idx" ON "service_orders"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_counters_prefix_key" ON "service_order_counters"("prefix");

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_assigned_advisor_id_fkey" FOREIGN KEY ("assigned_advisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_assigned_mechanic_id_fkey" FOREIGN KEY ("assigned_mechanic_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
