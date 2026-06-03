import { prisma } from "../lib/prisma";

async function seedTracking() {
  console.log("🚀 Seeding Tracking Data for Operations Map...");

  try {
    // Get a delivery agent
    const deliveryAgent1 = await prisma.user.findFirst({ where: { role: 'DELIVERY' } });
    let rider1 = deliveryAgent1;

    if (!rider1) {
      rider1 = await prisma.user.create({
        data: {
          fullName: "Ahmed Delivery",
          email: "ahmed.del@shoofly.com",
          password: "hash",
          role: 'DELIVERY',
          phone: "01011111111",
          isActive: true
        }
      });
    }

    const deliveryAgent2 = await prisma.user.findFirst({ where: { role: 'DELIVERY', id: { not: rider1.id } } });
    let rider2 = deliveryAgent2;

    if (!rider2) {
      rider2 = await prisma.user.create({
        data: {
          fullName: "Mohamed Delivery",
          email: "mohamed.del@shoofly.com",
          password: "hash",
          role: 'DELIVERY',
          phone: "01022222222",
          isActive: true
        }
      });
    }

    // Get active requests or create them
    let req1 = await prisma.request.findFirst({ where: { status: 'OPEN_FOR_BIDDING' } });
    if (!req1) {
       const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
       const cat = await prisma.category.findFirst();
       if(client && cat) {
           req1 = await prisma.request.create({
             data: {
               clientId: client.id,
               categoryId: cat.id,
               title: "طلب نشط للمحاكاة 1",
               description: "وصف",
               status: 'OPEN_FOR_BIDDING',
               budget: 500,
               address: "التجمع الخامس",
               latitude: 30.0131,
               longitude: 31.4089,
               deliveryPhone: "0111111"
             }
           });
       }
    }

    let req2 = await prisma.request.findFirst({ where: { status: 'ORDER_PAID_PENDING_DELIVERY' } });
    if (!req2) {
       const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
       const cat = await prisma.category.findFirst();
       if(client && cat) {
           req2 = await prisma.request.create({
             data: {
               clientId: client.id,
               categoryId: cat.id,
               title: "شحنة أيفون 13 (قيد التوصيل)",
               description: "وصف",
               status: 'ORDER_PAID_PENDING_DELIVERY',
               assignedDeliveryAgentId: rider1.id,
               budget: 15000,
               address: "مدينة نصر",
               latitude: 30.0626,
               longitude: 31.3242,
               deliveryPhone: "0112222"
             }
           });
       }
    }

    // Assign rider 2 to another active request
    let req3 = await prisma.request.findFirst({ where: { status: 'ORDER_PAID_PENDING_DELIVERY', id: { not: req2?.id } } });
    if (!req3) {
       const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
       const cat = await prisma.category.findFirst();
       if(client && cat) {
           req3 = await prisma.request.create({
             data: {
               clientId: client.id,
               categoryId: cat.id,
               title: "قطعة غيار تويوتا",
               description: "وصف",
               status: 'ORDER_PAID_PENDING_DELIVERY',
               assignedDeliveryAgentId: rider2.id,
               budget: 2500,
               address: "مصر الجديدة",
               latitude: 30.0926,
               longitude: 31.3242,
               deliveryPhone: "0113333"
             }
           });
       }
    }

    // Add Live Tracking Points!
    if (req2) {
        await prisma.deliveryTracking.create({
            data: {
                requestId: req2.id,
                latitude: 30.0526,
                longitude: 31.3142,
                status: 'IN_TRANSIT',
                speed: 45.5,
                locationText: "عباس العقاد, مدينة نصر"
            }
        });
    }

    if (req3) {
        await prisma.deliveryTracking.create({
            data: {
                requestId: req3.id,
                latitude: 30.0826,
                longitude: 31.3342,
                status: 'OUT_FOR_DELIVERY',
                speed: 60.2,
                locationText: "شارع الثورة, مصر الجديدة"
            }
        });
    }

    console.log("✅ Live Tracking Data Seeded Successfully!");

  } catch (err) {
    console.error("❌ Error seeding tracking data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedTracking();
