-- Trust & phone verification migration
-- Adds: phone verification, trust score, suspension, vendor reports, OTP, trust events

-- 1. User: phone verification + trust score + suspension
ALTER TABLE "User"
  ADD COLUMN "phoneVerified"    BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "phoneVerifiedAt"  TIMESTAMP(3),
  ADD COLUMN "trustScore"       INTEGER      NOT NULL DEFAULT 100,
  ADD COLUMN "suspendedUntil"   TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT;

CREATE INDEX "User_trustScore_idx" ON "User"("trustScore");
CREATE INDEX "User_suspendedUntil_idx" ON "User"("suspendedUntil");

-- 2. New enums
CREATE TYPE "OtpPurpose" AS ENUM ('PHONE_VERIFY', 'LOGIN');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHONE_OTP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REQUEST_REPORTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REQUEST_AUTO_CLOSED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'USER_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'USER_REINSTATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AI_FLAGGED_REQUEST';

-- 3. RequestReport
CREATE TABLE "RequestReport" (
  "id"           SERIAL          PRIMARY KEY,
  "requestId"    INTEGER         NOT NULL,
  "reportedById" INTEGER         NOT NULL,
  "reason"       TEXT            NOT NULL,
  "details"      TEXT,
  "resolved"     BOOLEAN         NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestReport_requestId_fkey"    FOREIGN KEY ("requestId")    REFERENCES "Request"("id") ON DELETE CASCADE,
  CONSTRAINT "RequestReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id")    ON DELETE CASCADE
);

CREATE UNIQUE INDEX "RequestReport_requestId_reportedById_key" ON "RequestReport"("requestId", "reportedById");
CREATE INDEX "RequestReport_requestId_idx"    ON "RequestReport"("requestId");
CREATE INDEX "RequestReport_reportedById_idx" ON "RequestReport"("reportedById");
CREATE INDEX "RequestReport_resolved_idx"     ON "RequestReport"("resolved");

-- 4. TrustEvent
CREATE TABLE "TrustEvent" (
  "id"        SERIAL       PRIMARY KEY,
  "userId"    INTEGER      NOT NULL,
  "delta"     INTEGER      NOT NULL,
  "reason"    TEXT         NOT NULL,
  "actorId"   INTEGER,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustEvent_userId_fkey" FOREIGN KEY ("userId")  REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "TrustEvent_userId_createdAt_idx" ON "TrustEvent"("userId", "createdAt");

-- 5. PhoneOtp
CREATE TABLE "PhoneOtp" (
  "id"        SERIAL          PRIMARY KEY,
  "userId"    INTEGER         NOT NULL,
  "phone"     TEXT            NOT NULL,
  "codeHash"  TEXT            NOT NULL,
  "purpose"   "OtpPurpose"    NOT NULL DEFAULT 'PHONE_VERIFY',
  "attempts"  INTEGER         NOT NULL DEFAULT 0,
  "consumed"  BOOLEAN         NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3)    NOT NULL,
  "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "PhoneOtp_userId_consumed_expiresAt_idx" ON "PhoneOtp"("userId", "consumed", "expiresAt");
CREATE INDEX "PhoneOtp_phone_purpose_idx"             ON "PhoneOtp"("phone", "purpose");
