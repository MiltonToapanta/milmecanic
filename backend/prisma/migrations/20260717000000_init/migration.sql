CREATE TABLE "roles" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(80) NOT NULL UNIQUE,
  "description" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "permissions" (
  "id" UUID PRIMARY KEY,
  "code" VARCHAR(120) NOT NULL UNIQUE,
  "name" VARCHAR(120) NOT NULL,
  "description" VARCHAR(255),
  "module" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "role_permissions" (
  "id" UUID PRIMARY KEY,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id")
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "first_name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(180) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "phone" VARCHAR(30),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "updated_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "refresh_tokens" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  "replaced_by" UUID,
  "ip_address" VARCHAR(80),
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "workshop_settings" (
  "id" UUID PRIMARY KEY,
  "trade_name" VARCHAR(160) NOT NULL,
  "legal_name" VARCHAR(160),
  "tax_id" VARCHAR(40),
  "address" VARCHAR(255),
  "phone" VARCHAR(30),
  "email" VARCHAR(180),
  "logo_url" TEXT,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Guayaquil',
  "service_order_prefix" VARCHAR(15) NOT NULL DEFAULT 'OT',
  "quotation_prefix" VARCHAR(15) NOT NULL DEFAULT 'COT',
  "internal_invoice_prefix" VARCHAR(15) NOT NULL DEFAULT 'FAC',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "created_by_id" UUID,
  "updated_by_id" UUID
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "action" VARCHAR(80) NOT NULL,
  "module" VARCHAR(80) NOT NULL,
  "entity" VARCHAR(120),
  "entity_id" VARCHAR(120),
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" VARCHAR(80),
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX "permissions_module_idx" ON "permissions"("module");
CREATE INDEX "users_role_id_idx" ON "users"("role_id");
CREATE INDEX "users_is_active_idx" ON "users"("is_active");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
