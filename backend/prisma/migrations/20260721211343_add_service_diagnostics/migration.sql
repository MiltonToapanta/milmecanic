-- CreateEnum
CREATE TYPE "DiagnosticItemStatus" AS ENUM ('GOOD', 'REGULAR', 'BAD', 'NOT_CHECKED');

-- CreateEnum
CREATE TYPE "DiagnosticSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DiagnosticCategory" AS ENUM ('ENGINE', 'BRAKES', 'SUSPENSION', 'STEERING', 'TRANSMISSION', 'ELECTRICAL', 'BATTERY', 'TIRES', 'COOLING', 'EXHAUST', 'BODY', 'LIGHTS', 'FLUIDS', 'OTHER');

-- CreateTable
CREATE TABLE "service_diagnostics" (
    "id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "general_observation" TEXT,
    "recommendation" TEXT,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "service_diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_diagnostic_items" (
    "id" UUID NOT NULL,
    "diagnostic_id" UUID NOT NULL,
    "category" "DiagnosticCategory" NOT NULL,
    "item_name" VARCHAR(120) NOT NULL,
    "status" "DiagnosticItemStatus" NOT NULL,
    "observation" TEXT,
    "severity" "DiagnosticSeverity",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "service_diagnostic_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_diagnostics_service_order_id_idx" ON "service_diagnostics"("service_order_id");

-- CreateIndex
CREATE INDEX "service_diagnostics_completed_at_idx" ON "service_diagnostics"("completed_at");

-- CreateIndex
CREATE INDEX "service_diagnostics_deleted_at_idx" ON "service_diagnostics"("deleted_at");

-- CreateIndex
CREATE INDEX "service_diagnostic_items_diagnostic_id_idx" ON "service_diagnostic_items"("diagnostic_id");

-- CreateIndex
CREATE INDEX "service_diagnostic_items_category_idx" ON "service_diagnostic_items"("category");

-- CreateIndex
CREATE INDEX "service_diagnostic_items_status_idx" ON "service_diagnostic_items"("status");

-- CreateIndex
CREATE INDEX "service_diagnostic_items_severity_idx" ON "service_diagnostic_items"("severity");

-- CreateIndex
CREATE INDEX "service_diagnostic_items_deleted_at_idx" ON "service_diagnostic_items"("deleted_at");

-- AddForeignKey
ALTER TABLE "service_diagnostics" ADD CONSTRAINT "service_diagnostics_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_diagnostics" ADD CONSTRAINT "service_diagnostics_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_diagnostics" ADD CONSTRAINT "service_diagnostics_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_diagnostic_items" ADD CONSTRAINT "service_diagnostic_items_diagnostic_id_fkey" FOREIGN KEY ("diagnostic_id") REFERENCES "service_diagnostics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
