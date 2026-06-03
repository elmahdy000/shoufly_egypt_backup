import { prisma } from "../lib/prisma";
import { updatePlatformSettings, getPlatformSettings } from "../lib/services/admin/platform-settings";
import { blockUser, verifyUser } from "../lib/services/admin/moderation";
import { reviewRequest } from "../lib/services/admin/review-request";
import { getAuditLogs } from "../lib/services/admin/audit-log";
import { getPlatformStats } from "../lib/services/admin/get-platform-stats";

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not defined in environment.");
  process.exit(1);
}

async function runSimulation() {
  console.log("🚀 Starting Full Admin Operations Simulation...");

  // 1. Setup: Find or Create an Admin and a Test User
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log("Creating dummy admin...");
    admin = await prisma.user.create({
      data: {
        fullName: "System Simulator",
        email: "sim@shoofly.com",
        password: "hash",
        role: 'ADMIN',
        isActive: true
      }
    });
  }

  let testUser = await prisma.user.findFirst({ where: { role: 'VENDOR' } });
  if (!testUser) {
    console.log("Creating dummy vendor...");
    testUser = await prisma.user.create({
      data: {
        fullName: "Test Vendor",
        email: "vendor@test.com",
        password: "hash",
        role: 'VENDOR',
        isActive: true
      }
    });
  }

  console.log(`Using Admin: ${admin.fullName} (ID: ${admin.id})`);
  console.log(`Target User: ${testUser.fullName} (ID: ${testUser.id})`);

  // --- STEP 1: Platform Settings ---
  console.log("\n--- STEP 1: Platform Settings ---");
  const oldSettings = await getPlatformSettings();
  console.log(`Current VAT: ${oldSettings.vatPercent}%`);
  
  await updatePlatformSettings({ vatPercent: 15 }, admin.id);
  const newSettings = await getPlatformSettings();
  console.log(`Updated VAT: ${newSettings.vatPercent}% ✅`);

  // --- STEP 2: Moderation (Blocking) ---
  console.log("\n--- STEP 2: Moderation (Blocking) ---");
  await blockUser(testUser.id, true, admin.id);
  let blockedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  console.log(`User Blocked? ${blockedUser?.isBlocked}, Active? ${blockedUser?.isActive} ✅`);

  await blockUser(testUser.id, false, admin.id);
  let unblockedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  console.log(`User Unblocked? ${unblockedUser?.isBlocked}, Active? ${unblockedUser?.isActive} ✅`);

  // --- STEP 3: Moderation (Verification/KYC) ---
  console.log("\n--- STEP 3: Moderation (Verification/KYC) ---");
  await verifyUser(testUser.id, true, admin.id);
  let verifiedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  console.log(`User Verified? ${verifiedUser?.isVerified}, Status: ${verifiedUser?.verificationStatus} ✅`);

  // --- STEP 4: Request Review ---
  console.log("\n--- STEP 4: Request Review ---");
  const category = await prisma.category.findFirst();
  const city = await prisma.city.findFirst();
  const gov = await prisma.governorate.findFirst();

  if (category && city && gov) {
    const request = await prisma.request.create({
      data: {
        title: "Simulation Request",
        description: "Need help with simulation",
        status: 'PENDING_ADMIN_REVISION',
        clientId: testUser.id,
        categoryId: category.id,
        governorateId: gov.id,
        cityId: city.id,
        address: "عنوان المحاكاة التجريبي",
        latitude: 30.0444,
        longitude: 31.2357,
        deliveryPhone: "01000000000"
      }
    });
    console.log(`Created Request #${request.id} in PENDING_ADMIN_REVISION`);

    await reviewRequest(request.id, 'approve', admin.id);
    const updatedRequest = await prisma.request.findUnique({ where: { id: request.id } });
    console.log(`Request Status after Admin Review: ${updatedRequest?.status} ✅`);
  }

  // --- STEP 5: Audit Logs Verification ---
  console.log("\n--- STEP 5: Audit Logs Verification ---");
  const logsResult = await getAuditLogs(undefined, undefined, 5);
  const logs = logsResult.logs;
  console.log(`Found ${logs.length} recent audit logs:`);
  logs.forEach(log => {
    console.log(`- [${log.createdAt.toISOString()}] Admin ${log.adminId} performed ${log.action} on ${log.targetType}#${log.targetId}`);
  });

  // --- STEP 6: Platform Stats ---
  console.log("\n--- STEP 6: Platform Stats ---");
  const stats = await getPlatformStats();
  console.log(`Total Users: ${stats.totalUsers}`);
  console.log(`Platform Revenue: ${stats.totalRevenue} EGP`);
  console.log(`Pending Actions: ${stats.pendingWithdrawals} Withdrawals, ${stats.pendingComplaints} Complaints`);
  console.log(`Daily Trends: ${JSON.stringify(stats.dailyTrends)} ✅`);

  console.log("\n✨ Simulation Completed Successfully!");
}

runSimulation()
  .catch(err => {
    console.error("❌ Simulation Failed!");
    if (err.message) console.error("Error Message:", err.message);
    if (err.code) console.error("Error Code:", err.code);
    if (err.meta) console.error("Error Meta:", JSON.stringify(err.meta));
    process.exit(1);
  });
