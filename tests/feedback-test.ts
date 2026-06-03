import { prisma } from '../lib/prisma';
import { createReview } from '../lib/services/reviews/create-review';
import { createComplaint } from '../lib/services/complaints/create-complaint';
import 'dotenv/config';

async function testFeedback() {
  console.log('📝 TESTING RATINGS & COMPLAINTS SYSTEM...\n');

  try {
    // 1. Find a successfully closed request from simulation
    let request = await prisma.request.findFirst({
        where: { status: 'CLOSED_SUCCESS' },
        include: { client: true }
    });

    if (!request) {
      console.log('Creating a dummy closed request for testing feedback...');
      const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
      const vendor = await prisma.user.findFirst({ where: { role: 'VENDOR' } });
      const category = await prisma.category.findFirst({ where: { parentId: { not: null } } }) || await prisma.category.findFirst();
      if (!client || !vendor || !category) throw new Error('Cannot create dummy request: entities missing');
      
      const newRequest = await prisma.request.create({
        data: {
          clientId: client.id,
          title: 'Feedback Test Dummy Request',
          description: 'Dummy description',
          categoryId: category.id,
          status: 'CLOSED_SUCCESS',
          address: 'Test address',
          latitude: 30.0,
          longitude: 31.0,
          deliveryPhone: '01000000000',
        }
      });
      
      await prisma.bid.create({
        data: {
          requestId: newRequest.id,
          vendorId: vendor.id,
          description: 'Test Bid',
          netPrice: 100,
          clientPrice: 115,
          status: 'ACCEPTED_BY_CLIENT'
        }
      });
      
      request = await prisma.request.findUnique({
        where: { id: newRequest.id },
        include: { client: true }
      });
    }

    if (!request) throw new Error('No closed request found and failed to create dummy.');

    // 2. Client leaves a Review
    console.log(`--- Step 1: Client (#${request.clientId}) leaving a 5-star Review ---`);
    const review = await createReview({
        requestId: request.id,
        reviewerId: request.clientId,
        rating: 5,
        comment: 'Excellent service and very professional vendor!'
    });
    console.log('✅ Review created successfully:', review.comment);

    // 3. Client files a Complaint
    console.log(`\n--- Step 2: Client (#${request.clientId}) filing a Complaint ---`);
    const complaint = await createComplaint({
        requestId: request.id,
        userId: request.clientId,
        subject: 'Delivery Delay',
        description: 'The order arrived 30 minutes later than promised.'
    });
    console.log('✅ Complaint recorded successfully:', complaint.subject);

    // 4. Verification Check
    const vendorStats = await prisma.review.aggregate({
        where: { reviewedId: review.reviewedId },
        _avg: { rating: true },
        _count: true
    });
    console.log(`\n📊 Vendor Performance Summary:`);
    console.log(`- Average Rating: ${vendorStats._avg.rating?.toFixed(1)} / 5`);
    console.log(`- Total Reviews: ${vendorStats._count}`);

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testFeedback();
