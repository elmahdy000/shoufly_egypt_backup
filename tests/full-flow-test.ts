import { prisma } from '../lib/prisma';
import { createRequest } from '../lib/services/requests';
import { reviewRequest } from '../lib/services/admin';
import { createBid } from '../lib/services/bids';
import { forwardOffer } from '../lib/services/admin';
import { acceptOffer } from '../lib/services/offers';
import { payRequest } from '../lib/services/payments';
import { updateDeliveryStatus, acceptDeliveryTask, completeDeliveryAgent } from '../lib/services/delivery';
import { settleOrder } from '../lib/services/transactions';
import 'dotenv/config';

async function runFullFlow() {
  console.log('🔄 STARTING END-TO-END LIFECYCLE TEST 🔄\n');

  try {
    // Basic setup
    const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
    const vendor = await prisma.user.findFirst({ where: { role: 'VENDOR' } });
    const agent = await prisma.user.findFirst({ where: { role: 'DELIVERY' } });
    const category = await prisma.category.findFirst({ where: { parentId: { not: null } } }) || await prisma.category.findFirst();

    if (!client || !vendor || !agent || !category) throw new Error('Basic entities missing');

    console.log(`[1/9] 🆕 Creating Request...`);
    const request = await createRequest(client.id, {
        title: 'Full Flow Test',
        description: 'Testing the entire chain from Start to Success',
        categoryId: category.id,
        address: 'Downtown, Cairo',
        latitude: 30.05, longitude: 31.24, deliveryPhone: '01000000000'
    });
    console.log(`      ID: #${request.id} | Status: ${request.status}`);

    console.log(`\n[2/9] 🛡️ Admin Reviewing (Checking AI response)...`);
    const currentReq = await prisma.request.findUnique({ where: { id: request.id } });
    if (currentReq?.status === 'OPEN_FOR_BIDDING') {
        console.log(`      AI already approved request. Skipping manual review.`);
    } else {
        await reviewRequest(request.id, 'approve');
        console.log(`      Status Updated: OPEN_FOR_BIDDING`);
    }

    console.log(`\n[3/9] 💰 Vendor Submitting Bid...`);
    const bid = await createBid(vendor.id, {
        requestId: request.id,
        description: 'Professional service guarantee',
        netPrice: 200
    });
    console.log(`      Bid ID: #${bid.id} | Net: ${bid.netPrice} EGP | Client Price: ${bid.clientPrice} EGP`);

    console.log('\n[4/9] 📢 Admin Forwarding Offer...');
    await forwardOffer(bid.id);
    console.log(`      Offer is now visible to client`);

    console.log('\n[5/9] 💳 Client Accepting & Paying...');
    await prisma.user.update({ where: { id: client.id }, data: { walletBalance: 500 } });
    await acceptOffer(bid.id, client.id);
    await payRequest(request.id, client.id);
    console.log(`      Payment Success | Status: ORDER_PAID_PENDING_DELIVERY`);

    console.log('\n[6/9] 🍳 Vendor Preparation...');
    // NOTE: passing userId (which maps to the vendor)
    await updateDeliveryStatus({ requestId: request.id, userId: vendor.id, status: 'VENDOR_PREPARING' });
    await updateDeliveryStatus({ requestId: request.id, userId: vendor.id, status: 'READY_FOR_PICKUP' });
    console.log(`      Status: READY_FOR_PICKUP`);

    console.log(`\n[7/9] 🚚 Delivery Pickup...`);
    await acceptDeliveryTask(request.id, agent.id);
    console.log(`      Agent (#${agent.id}) is on the way`);

    console.log(`\n[8/9] 📍 Delivery Completion (QR Scan)...`);
    const dbReq = await prisma.request.findUnique({ where: { id: request.id }, select: { qrCode: true } });
    if (!dbReq?.qrCode) throw new Error('QR Code missing from database');

    await completeDeliveryAgent(request.id, agent.id, dbReq.qrCode);
    console.log(`      Arrived at Destination | QR Scanned Successfully`);

    console.log(`\n[9/9] 🏁 Final Settlement (QR Confirmed)...`);
    const finalResult = await settleOrder(request.id);
    console.log(`      Success! | Final Status: ${finalResult.finalRequestStatus}`);
    console.log(`      Payout to Vendor: ${finalResult.vendorPayout} EGP`);
    console.log(`      Admin Commission: ${finalResult.adminCommission} EGP`);

    console.log('\n✨ FULL LIFECYCLE TEST PASSED! ✨');

  } catch (error: any) {
    console.error('\n❌ FLOW BROKEN AT STEP:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
}

runFullFlow();
