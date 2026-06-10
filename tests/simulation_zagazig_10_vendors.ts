import { prisma } from '../lib/prisma';
import { createRequest } from '../lib/services/requests';
import { reviewRequest } from '../lib/services/admin';
import { createBid } from '../lib/services/bids';
import { forwardOffer } from '../lib/services/admin';
import { acceptOffer } from '../lib/services/offers';
import { payRequest } from '../lib/services/payments';
import { depositFunds } from '../lib/services/transactions';
import { completeDeliveryAgent } from '../lib/services/delivery';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Zagazig Coordinates
const ZAG_LAT = 30.5877;
const ZAG_LNG = 31.5020;

async function runZagazigSimulation() {
  console.log('\n======================================================================');
  console.log('🏁 بدء محاكاة سيناريو سوق الزقازيق: طلب عميل وتنافس 10 موردين والتسليم');
  console.log('======================================================================\n');

  try {
    const password = await bcrypt.hash('password123', 10);

    // 1. تجهيز المدينة والمحافظة
    console.log('📍 الخطوة 1: التحقق من وجود محافظة الشرقية ومدينة الزقازيق...');
    const sharqia = await prisma.governorate.upsert({
      where: { name: 'الشرقية' },
      update: {},
      create: { name: 'الشرقية', nameAr: 'الشرقية' }
    });

    const zagazig = await prisma.city.findFirst({
      where: { name: 'الزقازيق', governorateId: sharqia.id },
    }) ?? await prisma.city.create({
      data: { name: 'الزقازيق', nameAr: 'الزقازيق', governorateId: sharqia.id },
    });
    console.log(`✅ المحافظة: ${sharqia.name} | المدينة: ${zagazig.name}`);

    // جلب تصنيف صالح
    const category = await prisma.category.findFirst({ where: { slug: 'appliances' } })
      || await prisma.category.findFirst();
    if (!category) {
      throw new Error('❌ لم يتم العثور على تصنيف في النظام، يرجى تشغيل الـ Seed أولاً.');
    }

    // 2. إنشاء عميل في الزقازيق
    console.log('\n👥 الخطوة 2: تجهيز حساب العميل وشحن محفظته...');
    let client = await prisma.user.findFirst({ where: { email: 'client_zagazig@shoofly.com' } });
    if (!client) {
      client = await prisma.user.create({
        data: {
          fullName: 'أحمد الزقازيقي',
          email: 'client_zagazig@shoofly.com',
          role: 'CLIENT',
          phone: '01011111111',
          phoneVerified: true,
          isActive: true,
          password,
          cityId: zagazig.id,
          governorateId: sharqia.id,
          latitude: ZAG_LAT,
          longitude: ZAG_LNG,
          walletBalance: 0
        }
      });
    }
    
    // شحن المحفظة بمبلغ كافٍ لتغطية التكلفة
    const rechargeAmount = 10000;
    await depositFunds(client.id, rechargeAmount);
    client = await prisma.user.findUnique({ where: { id: client.id } }) as any;
    if (!client) throw new Error('Failed to reload client data');
    console.log(`✅ تم تجهيز العميل: ${client.fullName}`);
    console.log(`👛 رصيد محفظة العميل الحالي: ${client.walletBalance} ج.م`);

    // 3. إنشاء 10 موردين في الزقازيق
    console.log('\n🏪 الخطوة 3: إنشاء وتجهيز 10 موردين محليين في الزقازيق للسباق...');
    const vendors: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const email = `vendor_zag_shop${i}@shoofly.com`;
      let vendor = await prisma.user.findFirst({ where: { email } });
      if (!vendor) {
        vendor = await prisma.user.create({
          data: {
            fullName: `محل الزقازيق لـصيانة الأجهزة ${i}`,
            email,
            role: 'VENDOR',
            phone: `012${10000000 + i}`,
            phoneVerified: true,
            isActive: true,
            isVerified: true,
            verificationStatus: 'APPROVED',
            password,
            cityId: zagazig.id,
            governorateId: sharqia.id,
            latitude: ZAG_LAT + (Math.random() - 0.5) * 0.01, // توزيع جغرافي حول الزقازيق
            longitude: ZAG_LNG + (Math.random() - 0.5) * 0.01,
            vendorAddress: `شارع الجلاء، محل رقم ${i}، الزقازيق`,
            walletBalance: 0
          }
        });
      }
      vendors.push(vendor);
      console.log(`   🏪 تم تسجيل المورد: [${vendor.fullName}] - الرصيد الحالي: ${vendor.walletBalance} ج.م`);
    }

    // 4. إنشاء كابتن توصيل في الزقازيق
    console.log('\n🏍️ الخطوة 4: تجهيز كابتن توصيل في الزقازيق...');
    let rider = await prisma.user.findFirst({ where: { email: 'rider_zagazig@shoofly.com' } });
    if (!rider) {
      rider = await prisma.user.create({
        data: {
          fullName: 'كابتن عبده الزقازيقي',
          email: 'rider_zagazig@shoofly.com',
          role: 'DELIVERY',
          phone: '01599999999',
          phoneVerified: true,
          isActive: true,
          isVerified: true,
          verificationStatus: 'APPROVED',
          password,
          cityId: zagazig.id,
          governorateId: sharqia.id,
          latitude: ZAG_LAT,
          longitude: ZAG_LNG,
          vehicleType: 'MOTORCYCLE',
          walletBalance: 0
        }
      });
    }
    console.log(`✅ كابتن التوصيل: ${rider.fullName} | الرصيد الحالي: ${rider.walletBalance} ج.م`);

    // 5. العميل ينشر طلباً في الزقازيق
    console.log('\n📝 الخطوة 5: العميل ينشر طلباً جديداً لصيانة ثلاجة وغسالة...');
    const request = await createRequest(client.id, {
      title: 'صيانة ثلاجة توشيبا وغسالة إل جي بالزقازيق',
      description: 'الثلاجة مش بتبرد كويس والغسالة فيها صوت عالي أثناء العصر. محتاج فني يجي يفحص ويصلح في المنزل حي الزهور.',
      categoryId: category.id,
      address: 'حي الزهور، الزقازيق، الشرقية',
      latitude: ZAG_LAT,
      longitude: ZAG_LNG,
      deliveryPhone: client.phone || '01011111111',
      governorateId: sharqia.id,
      cityId: zagazig.id,
      budget: 5000,
    });
    if (!request) throw new Error('Failed to create request');
    console.log(`✅ تم نشر الطلب بنجاح! معرف الطلب: #${request.id}`);

    // موافقة الآدمن على الطلب لفتحه للمزايدة
    await reviewRequest(request.id, 'approve');
    console.log(`🛡️ تمت موافقة الآدمن. حالة الطلب الآن: OPEN_FOR_BIDDING`);

    // 6. الموردون الـ 10 يقدمون عروضهم بأسعار مختلفة
    console.log('\n💰 الخطوة 6: الموردون الـ 10 يتلقون الإشعار ويقدمون عروض أسعار تنافسية...');
    const bids: any[] = [];
    for (let i = 0; i < 10; i++) {
      const vendor = vendors[i];
      // الموردون يتنافسون بأسعار تبدأ من 2500 ج.م وتقل تدريجياً لزيادة فرصة القبول
      const netPrice = 2500 - (i * 100); 
      const bid = await createBid(vendor.id, {
        requestId: request.id,
        description: `أنا على استعداد للبدء فورا، سنقوم بفحص الثلاجة والغسالة مع قطع غيار أصلية وضمان 6 أشهر. عرض رقم ${i+1}`,
        netPrice,
      });
      console.log(`   📥 المورد [${vendor.fullName}] قدم عرضاً: السعر الصافي للمحل = ${netPrice} ج.م | السعر للعميل (شاملاً الرسوم) = ${bid.clientPrice} ج.م`);
      bids.push(bid);
    }

    // 7. الآدمن يمرر كافة العروض للعميل
    console.log('\n📢 الخطوة 7: الآدمن يوافق على تمرير العروض الـ 10 للعميل للمقارنة...');
    for (const b of bids) {
      await forwardOffer(b.id);
    }
    console.log(`✅ تم تمرير جميع العروض (${bids.length}) للعميل بنجاح.`);

    // 8. العميل يراجع العروض ويختار الأفضل (الأرخص سعراً)
    console.log('\n👀 الخطوة 8: العميل يقارن العروض ويختار العرض الأوفر...');
    const activeBids = await prisma.bid.findMany({
      where: { requestId: request.id, status: 'SELECTED' },
      include: { vendor: true }
    });

    // العثور على العرض الأقل سعراً
    const chosenBid = activeBids.reduce((prev: any, curr: any) => 
      (Number(curr.clientPrice) < Number(prev.clientPrice) ? curr : prev), activeBids[0]
    );

    console.log(`🎯 العرض المختار:`);
    console.log(`   🔸 المورد: ${chosenBid.vendor.fullName}`);
    console.log(`   🔸 السعر النهائي للعميل: ${chosenBid.clientPrice} ج.م`);
    console.log(`   🔸 وصف العرض: ${chosenBid.description}`);

    // العميل يؤكد العرض
    await acceptOffer(chosenBid.id, client.id);
    console.log('🤝 تم قبول العرض رسمياً من قبل العميل.');

    // 9. العميل يسدد القيمة لحساب الضمان (Escrow)
    console.log('\n💳 الخطوة 9: العميل يسدد قيمة الأوردر من محفظته لحساب الضمان...');
    const paymentResult = await payRequest(request.id, client.id);
    console.log(`✅ تم السداد بنجاح وحجز المبلغ في الضمان!`);
    console.log(`   🔒 كود التحقق الآمن (Secure QR Code): ${paymentResult.qrCode}`);

    // جلب حالة الطلب المحدثة
    let updatedRequest = await prisma.request.findUnique({ where: { id: request.id } });
    console.log(`   🔸 حالة الطلب الحالية: ${updatedRequest?.status}`);

    // 10. إسناد المهمة للمندوب (كابتن عبده) ومحاكاة خطوات التوصيل
    console.log('\n🚚 الخطوة 10: إسناد مهمة التوصيل لكابتن عبده ومحاكاة خط السير...');
    
    // إسناد المندوب
    await prisma.request.update({
      where: { id: request.id },
      data: { assignedDeliveryAgentId: rider.id }
    });

    // تسجيل حالات تتبع خط السير
    const trackingSteps = [
      { status: 'VENDOR_PREPARING' as const, note: 'المحل يقوم بتجهيز الفني وقطع الغيار المطلوبة.' },
      { status: 'READY_FOR_PICKUP' as const, note: 'الفني جاهز للتحرك وبانتظار المندوب.' },
      { status: 'OUT_FOR_DELIVERY' as const, note: 'المندوب استلم الأوردر وهو في الطريق لعنوان العميل.' }
    ];

    for (const step of trackingSteps) {
      await prisma.deliveryTracking.create({
        data: {
          requestId: request.id,
          status: step.status,
          note: step.note,
          latitude: ZAG_LAT + (Math.random() - 0.5) * 0.005,
          longitude: ZAG_LNG + (Math.random() - 0.5) * 0.005,
        }
      });
      console.log(`   📍 تحديث التوصيل: [${step.status}] - ${step.note}`);
    }

    // 11. إتمام التوصيل الفعلي بمسح رمز الاستجابة السريعة (QR Code)
    console.log('\n🔒 الخطوة 11: المندوب يصل للعميل ويقوم بمسح الـ QR Code لتأكيد استلام العميل للخدمة...');
    if (!paymentResult.qrCode) throw new Error('No QR code generated for this request');
    
    const settlementResult = await completeDeliveryAgent(request.id, rider.id, paymentResult.qrCode);
    console.log(`🎉 تم تسليم الأوردر وإجراء التسوية المالية الفورية بنجاح!`);

    // 12. التحقق النهائي من المحافظ المالية لجميع الأطراف
    console.log('\n💰 الخطوة 12: الفحص المالي النهائي للمحافظ والمعاملات:');
    console.log('==================================================');
    
    const [finalClient, finalVendor, finalRider, finalAdmin] = await Promise.all([
      prisma.user.findUnique({ where: { id: client.id } }),
      prisma.user.findUnique({ where: { id: chosenBid.vendorId } }),
      prisma.user.findUnique({ where: { id: rider.id } }),
      prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { id: 'asc' } })
    ]);

    console.log(`👛 محفظة العميل (رصيد شحن 10,000 ج.م خصم منه ${chosenBid.clientPrice} ج.م):`);
    console.log(`   💵 رصيد العميل الحالي: ${finalClient?.walletBalance} ج.م`);

    console.log(`👛 محفظة المورد (مستحقات المورد الصافية):`);
    console.log(`   💵 رصيد المورد الحالي: ${finalVendor?.walletBalance} ج.م (تلقى +${settlementResult.vendorPayout} ج.م)`);

    console.log(`👛 محفظة مندوب التوصيل (أجرة التوصيل):`);
    console.log(`   💵 رصيد المندوب الحالي: ${finalRider?.walletBalance} ج.م (تلقى +${settlementResult.riderPayout} ج.م)`);

    console.log(`👛 محفظة عمولة المنصة (الأدمن):`);
    console.log(`   💵 رصيد الأدمن الحالي: ${finalAdmin?.walletBalance} ج.م (تلقى +${settlementResult.adminCommission} ج.m)`);

    console.log('\n======================================================================');
    console.log('🎉 تم الانتهاء من محاكاة سوق الزقازيق بنجاح تام وبأمان مالي 100%!');
    console.log('======================================================================\n');

  } catch (err: any) {
    console.error('\n❌ فشلت المحاكاة بسبب خطأ:');
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

runZagazigSimulation();
