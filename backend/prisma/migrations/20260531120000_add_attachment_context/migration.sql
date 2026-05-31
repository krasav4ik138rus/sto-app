-- CreateEnum
CREATE TYPE "attachment_context_type" AS ENUM ('ORDER', 'INSPECTION_ACT', 'INSPECTION_FIELD', 'DIAGNOSTIC', 'DIAGNOSTIC_ITEM', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "attachment_context_side" AS ENUM ('NONE', 'LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "order_attachments"
  ADD COLUMN "context_type" "attachment_context_type" NOT NULL DEFAULT 'ORDER',
  ADD COLUMN "context_section_id" TEXT,
  ADD COLUMN "context_field_id" TEXT,
  ADD COLUMN "context_side" "attachment_context_side" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "context_label" TEXT;

-- CreateIndex
CREATE INDEX "order_attachments_organization_id_context_type_created_at_idx" ON "order_attachments"("organization_id", "context_type", "created_at");

-- CreateIndex
CREATE INDEX "order_attachments_work_order_id_context_type_created_at_idx" ON "order_attachments"("work_order_id", "context_type", "created_at");

-- CreateIndex
CREATE INDEX "order_attachments_diag_item_side_idx" ON "order_attachments"("diagnostic_id", "context_field_id", "context_side");

-- CreateIndex
CREATE INDEX "order_attachments_inspection_act_id_context_field_id_idx" ON "order_attachments"("inspection_act_id", "context_field_id");
