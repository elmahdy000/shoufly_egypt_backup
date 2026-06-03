import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Category structure for seeding
interface CategoryData {
  name: string;
  slug: string;
  type: "SERVICE" | "PRODUCT" | "DIGITAL";
  requiresBrand: boolean;
  brandType?: string;
  subs?: CategoryData[];
}

async function seedDatabase() {
  console.log("🚀 Starting Comprehensive Shoofly Seed...\n");

  try {
    // 1. DELETE ALL DATA (order matters due to foreign keys)
    console.log("🧹 Cleaning database...");
    const tables = [
      'AdminAuditLog', 'Notification', 'Complaint', 'Review', 'Transaction', 
      'DeliveryTracking', 'ChatMessage', 'WithdrawalRequest', 'PaymentAttempt', 
      'BidImage', 'Bid', 'RequestImage', 'Request', 'VendorBrand', 'VendorCategory', 
      'Brand', 'Category', 'PlatformSetting', 'User', 'City', 'Governorate'
    ];

    for (const table of tables) {
      try {
        // @ts-ignore
        await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
        console.log(`   ✅ Cleaned ${table}`);
      } catch (e) {
        console.log(`   ⚠️ Could not clean ${table} (likely foreign key, will retry later)`);
      }
    }
    
    // Retry once in reverse for stubborn tables
    for (const table of [...tables].reverse()) {
      try {
        // @ts-ignore
        await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
      } catch (e) {}
    }
    console.log("✅ Database cleaning phase finished\n");

    // 2. CREATE PLATFORM SETTINGS
    console.log("⚙️ Creating Platform Settings...");
    const settings = await prisma.platformSetting.create({
      data: {
        commissionPercent: 15,
        minVendorMatchCount: 3,
        initialRadiusKm: 5,
        maxRadiusKm: 50,
        radiusExpansionStepKm: 5,
      },
    });
    console.log("✅ Platform Settings Created\n");

    // 3. SEED LOCATIONS (Governorates & Cities)
    console.log("📍 Seeding Locations...");
    const governoratesData = [
      { name: "Cairo", arabicName: "القاهرة", cities: ["القاهرة الجديدة", "مدينة نصر", "المعادي", "وسط البلد", "مصر الجديدة", "حلوان", "المرج", "شبرا", "البساتين", "روض الفرج", "الزيتون", "عين شمس"] },
      { name: "Giza", arabicName: "الجيزة", cities: ["المهندسين", "الدقي", "الهرم", "فيصل", "أكتوبر", "الشيخ زايد", "العمرانية", "الوراق", "إمبابة", "الحوامدية", "البدرشين", "العياط"] },
      { name: "Alexandria", arabicName: "الإسكندرية", cities: ["سموحة", "المنتزة", "العجمي", "وسط الإسكندرية", "الرمل", "سيدي جابر", "العامرية", "برج العرب", "كرموز", "اللبان"] },
      { name: "Sharqia", arabicName: "الشرقية", cities: ["الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح", "أبو حماد", "فاقوس", "الحسينية", "كفر صقر", "أولاد صقر", "مشتول السوق", "ديرب نجم", "الإبراهيمية"] },
      { name: "Dakahlia", arabicName: "الدقهلية", cities: ["المنصورة", "طلخا", "ميت غمر", "السنبلاوين", "دكرنس", "بلقاس", "شربين", "المنزلة", "منية النصر", "جمصة"] },
      { name: "Beheira", arabicName: "البحيرة", cities: ["دمنهور", "كفر الدوار", "رشيد", "إيتاي البارود", "أبو حمص", "كوم حمادة", "شبراخيت", "الدلنجات", "حوش عيسى", "وادي النطرون"] },
      { name: "Qalyubia", arabicName: "القليوبية", cities: ["بنها", "شبرا الخيمة", "العبور", "قليوب", "الخانكة", "طوخ", "قها", "شين القناطر", "كفر شكر"] },
      { name: "Gharbia", arabicName: "الغربية", cities: ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "قطور", "بسيون", "سمنود"] },
      { name: "Monufia", arabicName: "المنوفية", cities: ["شبين الكوم", "قويسنا", "بركة السبع", "منوف", "مدينة السادات", "أشمون", "الباجور", "تلا", "الشهداء"] },
      { name: "Fayoum", arabicName: "الفيوم", cities: ["الفيوم", "إطسا", "طامية", "سنورس", "أبشواي", "يوسف الصديق"] },
      { name: "Kafr El Sheikh", arabicName: "كفر الشيخ", cities: ["كفر الشيخ", "دسوق", "فوه", "بيلا", "الحامول", "بلطيم", "مطوبس", "سيدي سالم", "قلين"] },
      { name: "Ismailia", arabicName: "الإسماعيلية", cities: ["الإسماعيلية", "التل الكبير", "فايد", "القنطرة شرق", "القنطرة غرب", "أبو صوير", "القصاصين"] },
      { name: "Suez", arabicName: "السويس", cities: ["السويس", "الأربعين", "الجناين", "عتاقة", "فيصل (السويس)"] },
      { name: "Port Said", arabicName: "بورسعيد", cities: ["بورسعيد", "بورفؤاد", "حي العرب", "حي الشرق", "حي الضواحي"] },
      { name: "Damietta", arabicName: "دمياط", cities: ["دمياط", "دمياط الجديدة", "رأس البر", "فارسكور", "الزرقا", "كفر سعد", "السرو"] },
      { name: "Assiut", arabicName: "أسيوط", cities: ["أسيوط", "ديروط", "منفلوط", "القوصية", "أبوتيج", "صدفا", "الغنايم", "ساحل سليم", "البداري"] },
      { name: "Sohag", arabicName: "سوهاج", cities: ["سوهاج", "أخميم", "طما", "طهطا", "جرجا", "البلينا", "المنشاة", "ساقلتة", "دار السلام"] },
      { name: "Qena", arabicName: "قنا", cities: ["قنا", "نجع حمادي", "دشنا", "قوص", "أبو تشت", "فرشوط", "قفط", "نقادة"] },
      { name: "Minya", arabicName: "المنيا", cities: ["المنيا", "ملوي", "بني مزار", "مغاغة", "سمالوط", "أبو قرقاص", "مطاي", "العدوة", "دير مواس"] },
      { name: "Beni Suef", arabicName: "بني سويف", cities: ["بني سويف", "الواسطى", "ناصر", "ببا", "الفشن", "سمسطا", "إهناسيا"] },
      { name: "Luxor", arabicName: "الأقصر", cities: ["الأقصر", "إسنا", "أرمنت", "البياضية", "القرنة", "الطود"] },
      { name: "Aswan", arabicName: "أسوان", cities: ["أسوان", "كوم أمبو", "إدفو", "نصر النوبة", "درو", "أبو سمبل"] },
      { name: "Red Sea", arabicName: "البحر الأحمر", cities: ["الغردقة", "سفاجا", "القصير", "مرسى علم", "رأس غارب", "شلاتين", "حلايب"] },
      { name: "Matrouh", arabicName: "مطروح", cities: ["مرسى مطروح", "العلمين", "الضبعة", "الحمام", "سيوة", "براني", "السلوم"] },
      { name: "New Valley", arabicName: "الوادي الجديد", cities: ["الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"] },
      { name: "North Sinai", arabicName: "شمال سيناء", cities: ["العريش", "بئر العبد", "الشيخ زويد", "رفح", "الحسنة"] },
      { name: "South Sinai", arabicName: "جنوب سيناء", cities: ["شرم الشيخ", "طور سيناء", "دهب", "نويبع", "طابا", "سانت كاترين", "أبو رديس", "أبو زنيمة"] },
    ];

    const governoratesMap = new Map<string, number>();

    for (const govData of governoratesData) {
      const gov = await prisma.governorate.create({
        data: {
          name: govData.name,
          nameAr: govData.arabicName,
        },
      });
      governoratesMap.set(govData.name, gov.id);

      for (const cityName of govData.cities) {
        await prisma.city.create({
          data: {
            name: cityName,
            nameAr: cityName, // Use the same name for both for now, or add translations if available
            governorateId: gov.id,
          },
        });
      }
    }
    console.log("✅ Locations Seeded\n");

    // 4. SEED CATEGORIES & BRANDS
    console.log("📦 Seeding Categories and Brands...");

    const categories: CategoryData[] = [
      // CARS
      {
        name: "السيارات والمحركات",
        slug: "cars",
        type: "SERVICE",
        requiresBrand: true,
        brandType: "CARS",
        subs: [
          {
            name: "قطع غيار سيارات",
            slug: "car-parts",
            type: "PRODUCT",
            requiresBrand: true,
            brandType: "CARS",
          },
          {
            name: "صيانة ميكانيكا وعمرة",
            slug: "car-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "CARS",
          },
          {
            name: "كهرباء وتكييف سيارات",
            slug: "car-electric",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "CARS",
          },
          {
            name: "كاوتش وبطاريات",
            slug: "tires-batteries",
            type: "PRODUCT",
            requiresBrand: false,
          },
          {
            name: "سمكرة ودهان",
            slug: "car-body-painting",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "عفشة وهيدروليك",
            slug: "suspension-repair",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "ونش إنقاذ",
            slug: "car-towing",
            type: "SERVICE",
            requiresBrand: false,
          },
        ],
      },

      // ELECTRONICS
      {
        name: "الإلكترونيات والموبايل",
        slug: "electronics",
        type: "SERVICE",
        requiresBrand: false,
        subs: [
          {
            name: "صيانة موبايلات",
            slug: "mobile-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "MOBILES",
          },
          {
            name: "صيانة لابتوب وكمبيوتر",
            slug: "laptop-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "LAPTOPS",
          },
          {
            name: "بلاي ستيشن وألعاب",
            slug: "gaming-services",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "GAMING",
          },
          {
            name: "صيانة شاشات وتلفزيون",
            slug: "tv-screens-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "APPLIANCES",
          },
        ],
      },

      // HOME APPLIANCES
      {
        name: "الأجهزة المنزلية",
        slug: "home-appliances",
        type: "SERVICE",
        requiresBrand: false,
        subs: [
          {
            name: "ثلاجات وفريزر",
            slug: "fridge-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "APPLIANCES",
          },
          {
            name: "غسالات ملابس",
            slug: "washer-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "APPLIANCES",
          },
          {
            name: "بوتاجازات وأفران",
            slug: "stove-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "APPLIANCES",
          },
          {
            name: "سخانات مياه",
            slug: "heater-repair",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "APPLIANCES",
          },
          {
            name: "تكييف وتبريد",
            slug: "ac-repairing",
            type: "SERVICE",
            requiresBrand: true,
            brandType: "APPLIANCES",
          },
        ],
      },

      // HOME SERVICES
      {
        name: "المنزل والتشطيبات",
        slug: "home-maintenance",
        type: "SERVICE",
        requiresBrand: false,
        subs: [
          {
            name: "سباكة وأعمال صحية",
            slug: "plumbing",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "كهرباء منازل",
            slug: "home-electricity",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "نجارة باب وشباك",
            slug: "carpentry",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "نقاشة ودهانات",
            slug: "painting",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "ألوميتال وزجاج",
            slug: "alumital",
            type: "SERVICE",
            requiresBrand: false,
          },
        ],
      },

      // BEAUTY & HEALTH
      {
        name: "الجمال والصحة",
        slug: "beauty-health",
        type: "SERVICE",
        requiresBrand: false,
        subs: [
          {
            name: "صالون حلاقة رجالي",
            slug: "barber",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "تجميل للنساء",
            slug: "womens-beauty",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "جيم واللياقة البدنية",
            slug: "gym-fitness",
            type: "SERVICE",
            requiresBrand: false,
          },
        ],
      },

      // PHARMACY & MEDICAL
      {
        name: "الصيدليات والأدوية",
        slug: "pharmacy",
        type: "PRODUCT",
        requiresBrand: false,
        subs: [
          {
            name: "أدوية عامة",
            slug: "general-medicines",
            type: "PRODUCT",
            requiresBrand: false,
          },
          {
            name: "فيتامينات ومكملات",
            slug: "vitamins-supplements",
            type: "PRODUCT",
            requiresBrand: false,
          },
        ],
      },

      // EDUCATION & TRAINING
      {
        name: "التعليم والتدريب",
        slug: "education",
        type: "SERVICE",
        requiresBrand: false,
        subs: [
          {
            name: "دروس خصوصية",
            slug: "tuition",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "دورات تدريبية",
            slug: "courses",
            type: "SERVICE",
            requiresBrand: false,
          },
        ],
      },

      // PETS & ANIMALS
      {
        name: "الحيوانات الأليفة",
        slug: "pets",
        type: "SERVICE",
        requiresBrand: false,
        subs: [
          {
            name: "عيادة بيطرية",
            slug: "veterinary",
            type: "SERVICE",
            requiresBrand: false,
          },
          {
            name: "حلاقة حيوانات",
            slug: "pet-grooming",
            type: "SERVICE",
            requiresBrand: false,
          },
        ],
      },
    ];

    // Recursive function to create categories
    async function createCategoriesRecursive(
      items: CategoryData[],
      parentId: number | null = null
    ): Promise<void> {
      for (const item of items) {
        // Check if category already exists by slug (to prevent duplicates)
        const existingCategory = await prisma.category.findUnique({
          where: { slug: item.slug },
        });

        let category;
        if (existingCategory) {
          // Update if exists
          category = await prisma.category.update({
            where: { id: existingCategory.id },
            data: {
              name: item.name,
              type: item.type,
              requiresBrand: item.requiresBrand,
              brandType: item.brandType || null,
              parentId,
            },
          });
        } else {
          // Create if doesn't exist
          category = await prisma.category.create({
            data: {
              name: item.name,
              slug: item.slug,
              type: item.type,
              requiresBrand: item.requiresBrand,
              brandType: item.brandType || null,
              parentId,
            },
          });
        }

        // Recursively create subcategories
        if (item.subs && item.subs.length > 0) {
          await createCategoriesRecursive(item.subs, category.id);
        }
      }
    }

    await createCategoriesRecursive(categories);
    console.log("✅ Categories Seeded\n");

    // 5. SEED BRANDS
    console.log("🏷️ Seeding Brands...");
    const brandData = [
      { name: "Toyota", type: "CARS" },
      { name: "Hyundai", type: "CARS" },
      { name: "Kia", type: "CARS" },
      { name: "Fiat", type: "CARS" },
      { name: "Nissan", type: "CARS" },
      { name: "Mercedes", type: "CARS" },
      { name: "BMW", type: "CARS" },
      { name: "Chery", type: "CARS" },
      { name: "MG", type: "CARS" },
      { name: "Renault", type: "CARS" },
      { name: "Mitsubishi", type: "CARS" },
      { name: "Skoda", type: "CARS" },

      { name: "iPhone", type: "MOBILES" },
      { name: "Samsung", type: "MOBILES" },
      { name: "Xiaomi", type: "MOBILES" },
      { name: "Oppo", type: "MOBILES" },
      { name: "Realme", type: "MOBILES" },
      { name: "Huawei", type: "MOBILES" },
      { name: "Infinix", type: "MOBILES" },

      { name: "Toshiba", type: "APPLIANCES" },
      { name: "Sharp", type: "APPLIANCES" },
      { name: "Fresh", type: "APPLIANCES" },
      { name: "Zanussi", type: "APPLIANCES" },
      { name: "LG", type: "APPLIANCES" },
      { name: "Kiriazi", type: "APPLIANCES" },
      { name: "Unionaire", type: "APPLIANCES" },
      { name: "Beko", type: "APPLIANCES" },
      { name: "Tornado", type: "APPLIANCES" },

      { name: "Dell", type: "LAPTOPS" },
      { name: "HP", type: "LAPTOPS" },
      { name: "Lenovo", type: "LAPTOPS" },
      { name: "ASUS", type: "LAPTOPS" },
      { name: "Apple Mac", type: "LAPTOPS" },
      { name: "Acer", type: "LAPTOPS" },

      { name: "PlayStation", type: "GAMING" },
      { name: "Xbox", type: "GAMING" },
      { name: "Nintendo", type: "GAMING" },
    ];

    for (const brand of brandData) {
      const slug = `${brand.type.toLowerCase()}-${brand.name.toLowerCase().replace(/\s+/g, "-")}`;

      await prisma.brand.upsert({
        where: { slug },
        update: { name: brand.name },
        create: {
          name: brand.name,
          slug,
          type: brand.type,
        },
      });
    }
    console.log("✅ Brands Seeded\n");

    // 6. SEED USERS
    console.log("👥 Seeding Users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const cairoGovId = governoratesMap.get("Cairo") || 1;

    // Admin
    const admin = await prisma.user.create({
      data: {
        fullName: "أحمد محمد - Admin",
        email: "admin@shoofly.com",
        password: hashedPassword,
        phone: "01000000000",
        role: "ADMIN",
        isActive: true,
        isVerified: true,
        governorateId: cairoGovId,
      },
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Clients
    const clients = [];
    for (let i = 1; i <= 3; i++) {
      const client = await prisma.user.create({
        data: {
          fullName: `عميل ${i}`,
          email: `client${i}@shoofly.com`,
          password: hashedPassword,
          phone: `0100000000${i}`,
          role: "CLIENT",
          isActive: true,
          isVerified: true,
          governorateId: cairoGovId,
          walletBalance: 5000,
        },
      });
      clients.push(client);
      console.log(`✅ Client created: ${client.email}`);
    }

    // Vendors
    const vendors = [];
    for (let i = 1; i <= 5; i++) {
      const vendor = await prisma.user.create({
        data: {
          fullName: `بائع ${i}`,
          email: `vendor${i}@shoofly.com`,
          password: hashedPassword,
          phone: `0100000001${i}`,
          role: "VENDOR",
          isActive: true,
          isVerified: true,
          governorateId: cairoGovId,
          walletBalance: 0,
        },
      });
      vendors.push(vendor);
      console.log(`✅ Vendor created: ${vendor.email}`);
    }

    // Delivery Agents
    const deliveryAgents = [];
    for (let i = 1; i <= 2; i++) {
      const agent = await prisma.user.create({
        data: {
          fullName: `عامل توصيل ${i}`,
          email: `delivery${i}@shoofly.com`,
          password: hashedPassword,
          phone: `0100000002${i}`,
          role: "DELIVERY",
          isActive: true,
          isVerified: true,
          governorateId: cairoGovId,
          walletBalance: 0,
        },
      });
      deliveryAgents.push(agent);
      console.log(`✅ Delivery Agent created: ${agent.email}`);
    }
    console.log();

    // 7. ASSIGN VENDOR CATEGORIES & BRANDS
    console.log("🎯 Assigning Vendor Specializations...");
    const carRepairCat = await prisma.category.findUnique({
      where: { slug: "car-repair" },
    });
    const mobileRepairCat = await prisma.category.findUnique({
      where: { slug: "mobile-repair" },
    });

    if (carRepairCat && vendors[0]) {
      await prisma.vendorCategory.create({
        data: {
          vendorId: vendors[0].id,
          categoryId: carRepairCat.id,
        },
      });
      console.log(`✅ Vendor 1 assigned to Car Repair`);
    }

    if (mobileRepairCat && vendors[1]) {
      await prisma.vendorCategory.create({
        data: {
          vendorId: vendors[1].id,
          categoryId: mobileRepairCat.id,
        },
      });
      console.log(`✅ Vendor 2 assigned to Mobile Repair`);
    }
    console.log();

    // 8. SEED REQUESTS & BIDS
    console.log("📝 Seeding Requests and Bids...");
    const carPartsCat = await prisma.category.findUnique({ where: { slug: "car-parts" } });
    const cairoCity = await prisma.city.findFirst({ where: { governorateId: cairoGovId } });

    if (clients[0] && carPartsCat) {
      const req1 = await prisma.request.create({
        data: {
          clientId: clients[0].id,
          categoryId: carPartsCat.id,
          title: "محتاج تيل فرامل تويوتا كورولا 2020",
          description: "أصلي أو ياباني بجودة عالية",
          status: "OPEN_FOR_BIDDING",
          budget: 1500,
          governorateId: cairoGovId,
          cityId: cairoCity?.id || 1,
          address: "123 Nile St, Garden City",
          latitude: 30.0444,
          longitude: 31.2357,
          deliveryPhone: "01000000001",
        }
      });
      console.log(`✅ Request created: ${req1.title}`);

      if (vendors[0]) {
        await prisma.bid.create({
          data: {
            requestId: req1.id,
            vendorId: vendors[0].id,
            description: "موجود تيل فرامل ياباني ماركة أكي بونو",
            netPrice: 1300,
            clientPrice: 1400,
            status: "PENDING"
          }
        });
      }
    }

    if (clients[1] && mobileRepairCat) {
      const gizaGov = await prisma.governorate.findUnique({ where: { name: "Giza" } });
      const gizaCity = await prisma.city.findFirst({ where: { governorateId: gizaGov?.id } });
      const req2 = await prisma.request.create({
        data: {
          clientId: clients[1].id,
          categoryId: mobileRepairCat.id,
          title: "تغيير شاشة iPhone 13 Pro",
          description: "الشاشة مكسورة وبحاجة لتغيير أصلية",
          status: "PENDING_ADMIN_REVISION",
          budget: 8000,
          governorateId: gizaGov?.id || cairoGovId,
          cityId: gizaCity?.id || cairoCity?.id || 1,
          address: "456 Pyramid Ave, Giza",
          latitude: 30.0131,
          longitude: 31.2089,
          deliveryPhone: "01000000002",
        }
      });
      console.log(`✅ Request created: ${req2.title}`);
    }
    console.log();

    // 9. SEED TRANSACTIONS
    console.log("💰 Seeding Transactions...");
    if (clients[0]) {
      await prisma.transaction.create({
        data: {
          userId: clients[0].id,
          amount: 5000,
          type: "WALLET_TOPUP",
          description: "Initial seed deposit",
          metadata: { provider: "FAWRY", reference: "SEED_REF_001" }
        }
      });
      
      // Update wallet balance to match
      await prisma.user.update({
        where: { id: clients[0].id },
        data: { walletBalance: 5000 }
      });
    }
    console.log("✅ Transactions Seeded\n");

    // 10. SUCCESS MESSAGE
    console.log("✨ ============================================");
    console.log("✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨");
    console.log("✨ ============================================\n");
    console.log("📊 Summary:");
    console.log(`   ✅ Platform Settings: 1`);
    console.log(`   ✅ Governorates: ${governoratesData.length}`);
    console.log(`   ✅ Cities: ${governoratesData.reduce((sum, g) => sum + g.cities.length, 0)}`);
    console.log(`   ✅ Categories (hierarchical): ${categories.length} main + subcategories`);
    console.log(`   ✅ Brands: ${brandData.length}`);
    console.log(`   ✅ Users: 1 Admin + 3 Clients + 5 Vendors + 2 Delivery Agents`);
    console.log(`   ✅ Requests: 2`);
    console.log(`   ✅ Bids: 1`);
    console.log(`   ✅ Transactions: 1`);
    console.log("\n🔑 Login Credentials:");
    console.log("   Admin: admin@shoofly.com / password123");
    console.log("   Client 1: client1@shoofly.com / password123");
    console.log("   Vendor 1: vendor1@shoofly.com / password123");
    console.log("   Delivery 1: delivery1@shoofly.com / password123\n");

  } catch (error) {
    console.error("❌ Seeding Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log("✅ Seed script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal Error:", error);
    process.exit(1);
  });
