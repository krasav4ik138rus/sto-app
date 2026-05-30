-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('MECHANIC', 'MASTER', 'DIRECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "work_order_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'APPROVED', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "recommendation_status" AS ENUM ('SUGGESTED', 'APPROVED', 'DECLINED', 'DONE');

-- CreateEnum
CREATE TYPE "attachment_type" AS ENUM ('PHOTO', 'DOCUMENT', 'VIDEO');

-- CreateEnum
CREATE TYPE "attachment_visibility" AS ENUM ('INTERNAL', 'CUSTOMER_VISIBLE');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_centers" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "service_center_id" UUID,
    "full_name" TEXT,
    "phone" TEXT,
    "role" "staff_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "customer_id" UUID,
    "brand" TEXT,
    "model" TEXT,
    "brand_model" TEXT NOT NULL,
    "vin" TEXT,
    "plate" TEXT,
    "engine_spec" TEXT,
    "year" INTEGER,
    "current_mileage" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "service_center_id" UUID,
    "customer_id" UUID,
    "vehicle_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "status" "work_order_status" NOT NULL DEFAULT 'OPEN',
    "visit_reason" TEXT,
    "mileage" INTEGER,
    "responsible_staff_profile_id" UUID,
    "created_by_staff_profile_id" UUID NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_status_history" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "from_status" "work_order_status",
    "to_status" "work_order_status" NOT NULL,
    "comment" TEXT,
    "changed_by_staff_profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_acts" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "data_json" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "completed_at" TIMESTAMP(3),
    "created_by_staff_profile_id" UUID NOT NULL,
    "updated_by_staff_profile_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_acts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostics" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "data_json" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "other_recommendations" TEXT,
    "alignment_comment" TEXT,
    "parts_total" DECIMAL(12,2),
    "service_total" DECIMAL(12,2),
    "grand_total" DECIMAL(12,2),
    "executor_staff_profile_id" UUID,
    "created_by_staff_profile_id" UUID NOT NULL,
    "updated_by_staff_profile_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "diagnostic_id" UUID,
    "inspection_act_id" UUID,
    "text" TEXT NOT NULL,
    "status" "recommendation_status" NOT NULL DEFAULT 'SUGGESTED',
    "parts_price" DECIMAL(12,2),
    "service_price" DECIMAL(12,2),
    "total_price" DECIMAL(12,2),
    "created_by_staff_profile_id" UUID NOT NULL,
    "updated_by_staff_profile_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_attachments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "inspection_act_id" UUID,
    "diagnostic_id" UUID,
    "recommendation_id" UUID,
    "type" "attachment_type" NOT NULL,
    "visibility" "attachment_visibility" NOT NULL DEFAULT 'INTERNAL',
    "storage_key" TEXT NOT NULL,
    "file_url" TEXT,
    "original_filename" TEXT,
    "mime_type" TEXT,
    "byte_size" INTEGER,
    "caption" TEXT,
    "created_by_staff_profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID,
    "staff_profile_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "service_centers_organization_id_idx" ON "service_centers"("organization_id");

-- CreateIndex
CREATE INDEX "service_centers_organization_id_name_idx" ON "service_centers"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_user_id_key" ON "staff_profiles"("user_id");

-- CreateIndex
CREATE INDEX "staff_profiles_organization_id_role_idx" ON "staff_profiles"("organization_id", "role");

-- CreateIndex
CREATE INDEX "staff_profiles_service_center_id_idx" ON "staff_profiles"("service_center_id");

-- CreateIndex
CREATE INDEX "customers_organization_id_phone_idx" ON "customers"("organization_id", "phone");

-- CreateIndex
CREATE INDEX "customers_organization_id_name_idx" ON "customers"("organization_id", "name");

-- CreateIndex
CREATE INDEX "vehicles_organization_id_vin_idx" ON "vehicles"("organization_id", "vin");

-- CreateIndex
CREATE INDEX "vehicles_organization_id_plate_idx" ON "vehicles"("organization_id", "plate");

-- CreateIndex
CREATE INDEX "vehicles_customer_id_idx" ON "vehicles"("customer_id");

-- CreateIndex
CREATE INDEX "work_orders_organization_id_status_idx" ON "work_orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "work_orders_organization_id_created_at_idx" ON "work_orders"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "work_orders_service_center_id_status_idx" ON "work_orders"("service_center_id", "status");

-- CreateIndex
CREATE INDEX "work_orders_customer_id_idx" ON "work_orders"("customer_id");

-- CreateIndex
CREATE INDEX "work_orders_vehicle_id_idx" ON "work_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "work_orders_responsible_staff_profile_id_idx" ON "work_orders"("responsible_staff_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_organization_id_number_key" ON "work_orders"("organization_id", "number");

-- CreateIndex
CREATE INDEX "work_order_status_history_organization_id_created_at_idx" ON "work_order_status_history"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "work_order_status_history_work_order_id_created_at_idx" ON "work_order_status_history"("work_order_id", "created_at");

-- CreateIndex
CREATE INDEX "work_order_status_history_changed_by_staff_profile_id_idx" ON "work_order_status_history"("changed_by_staff_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_acts_work_order_id_key" ON "inspection_acts"("work_order_id");

-- CreateIndex
CREATE INDEX "inspection_acts_organization_id_created_at_idx" ON "inspection_acts"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "inspection_acts_created_by_staff_profile_id_idx" ON "inspection_acts"("created_by_staff_profile_id");

-- CreateIndex
CREATE INDEX "diagnostics_organization_id_created_at_idx" ON "diagnostics"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "diagnostics_work_order_id_created_at_idx" ON "diagnostics"("work_order_id", "created_at");

-- CreateIndex
CREATE INDEX "diagnostics_executor_staff_profile_id_idx" ON "diagnostics"("executor_staff_profile_id");

-- CreateIndex
CREATE INDEX "recommendations_organization_id_status_idx" ON "recommendations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "recommendations_work_order_id_status_idx" ON "recommendations"("work_order_id", "status");

-- CreateIndex
CREATE INDEX "recommendations_diagnostic_id_idx" ON "recommendations"("diagnostic_id");

-- CreateIndex
CREATE INDEX "recommendations_inspection_act_id_idx" ON "recommendations"("inspection_act_id");

-- CreateIndex
CREATE INDEX "order_attachments_organization_id_created_at_idx" ON "order_attachments"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "order_attachments_work_order_id_created_at_idx" ON "order_attachments"("work_order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_attachments_inspection_act_id_idx" ON "order_attachments"("inspection_act_id");

-- CreateIndex
CREATE INDEX "order_attachments_diagnostic_id_idx" ON "order_attachments"("diagnostic_id");

-- CreateIndex
CREATE INDEX "order_attachments_recommendation_id_idx" ON "order_attachments"("recommendation_id");

-- CreateIndex
CREATE INDEX "order_attachments_created_by_staff_profile_id_idx" ON "order_attachments"("created_by_staff_profile_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_staff_profile_id_created_at_idx" ON "audit_logs"("staff_profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "service_centers" ADD CONSTRAINT "service_centers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_service_center_id_fkey" FOREIGN KEY ("service_center_id") REFERENCES "service_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_service_center_id_fkey" FOREIGN KEY ("service_center_id") REFERENCES "service_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_responsible_staff_profile_id_fkey" FOREIGN KEY ("responsible_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_staff_profile_id_fkey" FOREIGN KEY ("created_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_changed_by_staff_profile_id_fkey" FOREIGN KEY ("changed_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_acts" ADD CONSTRAINT "inspection_acts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_acts" ADD CONSTRAINT "inspection_acts_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_acts" ADD CONSTRAINT "inspection_acts_created_by_staff_profile_id_fkey" FOREIGN KEY ("created_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_acts" ADD CONSTRAINT "inspection_acts_updated_by_staff_profile_id_fkey" FOREIGN KEY ("updated_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_executor_staff_profile_id_fkey" FOREIGN KEY ("executor_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_created_by_staff_profile_id_fkey" FOREIGN KEY ("created_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_updated_by_staff_profile_id_fkey" FOREIGN KEY ("updated_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_diagnostic_id_fkey" FOREIGN KEY ("diagnostic_id") REFERENCES "diagnostics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_inspection_act_id_fkey" FOREIGN KEY ("inspection_act_id") REFERENCES "inspection_acts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_created_by_staff_profile_id_fkey" FOREIGN KEY ("created_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_updated_by_staff_profile_id_fkey" FOREIGN KEY ("updated_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_inspection_act_id_fkey" FOREIGN KEY ("inspection_act_id") REFERENCES "inspection_acts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_diagnostic_id_fkey" FOREIGN KEY ("diagnostic_id") REFERENCES "diagnostics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_created_by_staff_profile_id_fkey" FOREIGN KEY ("created_by_staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_staff_profile_id_fkey" FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
