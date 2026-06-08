const ARABIC_REGEX = /[\u0600-\u06FF]/;

const NAME_MAP: Record<string, string> = {
  smartphones: "الهواتف الذكية",
  smartphone: "الهواتف الذكية",
  phones: "الهواتف الذكية",
  "mobile phones": "الهواتف الذكية",
  "pro electronics": "إلكترونيات احترافية",
  "professional electronics": "إلكترونيات احترافية",
  "electronics pro": "إلكترونيات احترافية",
  pro: "احترافي",
  appliances: "أجهزة منزلية",
  "home appliances": "أجهزة منزلية",
  cars: "سيارات",
  vehicles: "مركبات",
  plumbing: "سباكة",
  electrical: "كهرباء",
  cleaning: "تنظيف",
  moving: "نقل",
  delivery: "توصيل",
  tutoring: "دروس",
  education: "تعليم",
  training: "تدريب",
  pharmacy: "صيدلية",
  medicine: "أدوية",
  medical: "طبية",
  beauty: "جمال",
  health: "صحة",
  veterinarian: "بيطرة",
  pets: "حيوانات أليفة",
  carwash: "غسيل سيارات",
  maintenance: "صيانة",
  repair: "إصلاح",
  installation: "تركيب",
  it: "تكنولوجيا",
  software: "برمجيات",
  programming: "برمجة",
  design: "تصميم",
  photography: "تصوير",
  consulting: "استشارات",
  legal: "قانونية",
  accounting: "محاسبة",
};

export function displayName(name: string | null | undefined): string {
  if (!name) return "";
  if (ARABIC_REGEX.test(name)) return name;
  const key = name.trim().toLowerCase();
  return NAME_MAP[key] ?? name;
}
