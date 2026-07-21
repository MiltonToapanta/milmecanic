-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "customer_signature_name" VARCHAR(160),
ADD COLUMN     "exterior_condition" TEXT,
ADD COLUMN     "interior_condition" TEXT,
ADD COLUMN     "received_accessories" TEXT,
ADD COLUMN     "workshop_signature_name" VARCHAR(160);

-- CreateTable
CREATE TABLE "service_order_photos" (
    "id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "service_order_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_order_photos_service_order_id_idx" ON "service_order_photos"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_photos_deleted_at_idx" ON "service_order_photos"("deleted_at");

-- AddForeignKey
ALTER TABLE "service_order_photos" ADD CONSTRAINT "service_order_photos_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
