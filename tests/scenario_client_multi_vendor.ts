import { prisma } from '../lib/prisma';
import { createRequest } from '../lib/services/requests';
import { reviewRequest } from '../lib/services/admin';
import { createBid } from '../lib/services/bids';
import { forwardOffer } from '../lib/services/admin';
import { acceptOffer } from '../lib/services/offers';
import { payRequest } from '../lib/services/payments';
import { depositFunds } from '../lib/services/transactions';
import 'dotenv/config';

async function runScenario() {
  console.log('\n==================================================');
  console.log('🏁 بدء محاكاة سيناريو طلب العميل وتنافس الموردين');
  console.log('==================================================\n');

  try {
    // 1. إعداد أو جلب المحافظة والمدينة
    console.log('📍 الخطوة 1: تجهيز الموقع الجغرافي (محافظة ومدينة)...');
    let gov = await prisma.governorate.findFirst();
    if (!gov) {
      gov = await prisma.governorate.create({
        data: { name: 'Cairo', nameAr: 'القاهرة' }
      });
      console.log(`✅ تم إنشاء محافظة جديدة: ${gov.nameAr}`);
    } else {
      console.log(`✅ تم استخدام المحافظة الحالية: ${gov.nameAr}`);
    }

    let city = await prisma.city.findFirst({ where: { governorateId: gov.id } });
    if (!city) {
      city = await prisma.city.create({
        data: { name: 'Downtown', nameAr: 'وسط البلد', governorateId: gov.id }
      });
      console.log(`✅ تم إنشاء مدينة جديدة: ${city.nameAr}`);
    } else {
      console.log(`✅ تم استخدام المدينة الحالية: ${city.nameAr}`);
    }

    // البحث عن تصنيف صالح للطلب
    const category = await prisma.category.findFirst({ where: { parentId: { not: null } } }) 
      || await prisma.category.findFirst();
    
    if (!category) {
      throw new Error('❌ لم يتم العثور على أي تصنيف في قاعدة البيانات. برجاء تشغيل الـ Seed أولاً.');
    }

    // جلب أو إنشاء عميل السيناريو
    let client = await prisma.user.findFirst({ where: { email: 'scenario_client@shoofly.com' } });
    if (!client) {
      client = await prisma.user.create({
        data: {
          fullName: 'عميل سيناريو التجربة',
          email: 'scenario_client@shoofly.com',
          role: 'CLIENT',
          phone: '01099999999',
          phoneVerified: true,
          isActive: true,
          password: 'password123',
        },
      });
      console.log(`✅ تم إنشاء عميل جديد: ${client.fullName}`);
    } else {
      console.log(`✅ تم استخدام العميل الحالي: ${client.fullName}`);
    }

    // شحن محفظة العميل لضمان توفر رصيد كافي للدفع لاحقاً
    console.log(`💰 شحن محفظة العميل بـ 5,000 جنيه...`);
    await depositFunds(client.id, 5000);
    client = await prisma.user.findUnique({ where: { id: client.id } }) as any;
    if (!client) throw new Error('Client load failed');
    console.log(`👛 رصيد محفظة العميل الحالي: ${client.walletBalance} جنيه.`);

    // تجهيز 3 موردين للسيناريو
    const vendorsData = [
      { name: 'مطعم الشيف حسن', email: 'vendor_chef_hassan@shoofly.com', phone: '01111111111' },
      { name: 'سوبر ماركت الأمانة', email: 'vendor_amana_supermarket@shoofly.com', phone: '01122222222' },
      { name: 'كافيه الياسمين', email: 'vendor_yasmin_cafe@shoofly.com', phone: '01133333333' }
    ];

    const vendors: any[] = [];
    for (const vData of vendorsData) {
      let vendor = await prisma.user.findFirst({ where: { email: vData.email } });
      if (!vendor) {
        vendor = await prisma.user.create({
          data: {
            fullName: vData.name,
            email: vData.email,
            role: 'VENDOR',
            phone: vData.phone,
            phoneVerified: true,
            isActive: true,
            isVerified: true,
            password: 'password123',
          }
        });
        console.log(`✅ تم إنشاء مورد جديد: ${vendor.fullName}`);
      } else {
        console.log(`✅ تم استخدام المورد الحالي: ${vendor.fullName}`);
      }
      vendors.push(vendor);
    }

    // 2. العميل يقوم بإنشاء طلب جديد
    console.log('\n📝 الخطوة 2: العميل يرسل طلباً جديداً للمنصة...');
    const request = await createRequest(client.id, {
      title: 'طلب وجبات ومشروبات للمكتب',
      description: 'أريد 10 وجبات غداء كاملة (أرز + خضار + دجاج) مع مشروبات غازية باردة للتوصيل للمكتب اليوم.',
      categoryId: category.id,
      address: 'وسط البلد، القاهرة، مصر',
      latitude: 30.0444,
      longitude: 31.2357,
      deliveryPhone: client.phone || '01099999999',
      governorateId: gov.id,
      cityId: city.id,
      budget: 2000,
    });
    
    if (!request) throw new Error('Failed to create request');
    console.log(`✅ تم إنشاء الطلب بنجاح!`);
    console.log(`   🔸 معرف الطلب: #${request.id}`);
    console.log(`   🔸 عنوان الطلب: ${request.title}`);
    console.log(`   🔸 الميزانية المحددة: ${request.budget} جنيه`);
    console.log(`   🔸 حالة الطلب الحالية: ${request.status}`);

    // 3. مراجعة المشرف والموافقة لجعله متاحاً للمزايدة
    console.log('\n🛡️ الخطوة 3: موافقة النظام/المشرف على الطلب لفتحه للمزايدة...');
    const dbReq = await prisma.request.findUnique({ where: { id: request.id } });
    if (!dbReq) throw new Error('Request not found in DB');
    
    if (dbReq.status === 'OPEN_FOR_BIDDING') {
      console.log(`   💡 الطلب تمت الموافقة عليه تلقائياً بفضل الذكاء الاصطناعي.`);
    } else {
      await reviewRequest(request.id, 'approve');
      console.log(`   💡 تم اعتماد الطلب يدوياً. الحالة الجديدة: OPEN_FOR_BIDDING`);
    }

    // 4. الموردون يستقبلون الطلب ويرفعون عروضهم
    console.log('\n📢 الخطوة 4: الموردون الثلاثة يقدمون عروض أسعار تنافسية...');
    const bidsData = [
      { vendorIndex: 0, desc: 'عرض شاورما عربي ومقبلات مشكلة ومشروبات غازية', price: 1500 },
      { vendorIndex: 1, desc: 'وجبات أرز وبسمتي مع نصف دجاجة مشوية وببسي بارد', price: 1350 }, // الأرخص
      { vendorIndex: 2, desc: 'وجبات برجر لحم بلدي فاخر مع بطاطس مقلية وعصائر طبيعية طازجة', price: 1700 }
    ];

    const bids: any[] = [];
    for (const bData of bidsData) {
      const vendor = vendors[bData.vendorIndex];
      const bid = await createBid(vendor.id, {
        requestId: request.id,
        description: bData.desc,
        netPrice: bData.price,
      });
      console.log(`   📥 المورد [${vendor.fullName}] قدم عرضاً بقيمة صافية: ${bid.netPrice} جنيه (السعر للعميل شاملاً الرسوم: ${bid.clientPrice} جنيه)`);
      bids.push(bid);
    }

    // 5. المشرف يمرر العروض للعميل
    console.log('\n📢 الخطوة 5: المشرف يقوم بتمرير واعتماد جميع العروض المقدمة لتصل للعميل...');
    for (const b of bids) {
      await forwardOffer(b.id);
    }
    console.log('   💡 تم تمرير كافة العروض للعميل بنجاح.');

    // 6. العميل يستعرض العروض ويختار الأفضل (الأقل سعراً)
    console.log('\n👀 الخطوة 6: العميل يستقبل العروض ويختار العرض الأنسب...');
    
    // جلب العروض الحالية المرتبطة بالطلب
    const activeBids = await prisma.bid.findMany({
      where: { requestId: request.id, status: 'SELECTED' },
      include: { vendor: true }
    });

    console.log(`   📋 العروض المتاحة للعميل حالياً (${activeBids.length} عروض):`);
    activeBids.forEach((ab: any, idx: number) => {
      console.log(`      ${idx + 1}. عرض من [${ab.vendor.fullName}] بقيمة: ${ab.clientPrice} جنيه | الوصف: ${ab.description}`);
    });

    // اختيار العرض الأقل سعراً تلقائياً
    const chosenBid = activeBids.reduce((prev: any, curr: any) => (Number(curr.clientPrice) < Number(prev.clientPrice) ? curr : prev), activeBids[0]);
    console.log(`   🎯 العميل يختار العرض الأفضل للطلب:`);
    console.log(`      🔹 المورد المختار: ${chosenBid.vendor.fullName}`);
    console.log(`      🔹 سعر العرض للعميل: ${chosenBid.clientPrice} جنيه`);

    // 7. العميل يقبل العرض
    console.log('\n🤝 الخطوة 7: العميل يؤكد قبول العرض المختار...');
    await acceptOffer(chosenBid.id, client.id);
    console.log(`   💡 تم قبول العرض بنجاح ورسمياً.`);

    // 8. العميل يدفع قيمة الطلب
    console.log('\n💳 الخطوة 8: العميل يقوم بالدفع من رصيد محفظته لحجز المبلغ في الضمان (Escrow)...');
    await payRequest(request.id, client.id);
    
    // جلب تفاصيل حالة الطلب الحالية ومحفظة العميل لمعرفة التأثير المالي
    const updatedClient = await prisma.user.findUnique({ where: { id: client.id } });
    const finalRequest = await prisma.request.findUnique({ where: { id: request.id } });

    console.log(`   💡 تم الدفع بنجاح:`);
    console.log(`      🔹 الحالة الحالية للطلب: ${finalRequest?.status}`);
    console.log(`      🔹 رصيد العميل بعد الدفع: ${updatedClient?.walletBalance} جنيه (خصم بقيمة ${chosenBid.clientPrice} جنيه)`);

    console.log('\n==================================================');
    console.log('🎉 تم اكتمال سيناريو المزايدة والدفع بنجاح 100%!');
    console.log('==================================================\n');

  } catch (err: any) {
    console.error('\n❌ فشل السيناريو بسبب خطأ:');
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السيناريو
runScenario();
