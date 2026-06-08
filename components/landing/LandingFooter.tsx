import Link from "next/link";
import { FiShield, FiPhone, FiGlobe, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiPlusSquare, FiUsers } from "react-icons/fi";
import { FaCcVisa, FaCcMastercard } from "react-icons/fa";
import { UserRole } from "@/lib/types/landing";

interface LandingFooterProps {
  userRole?: UserRole;
}

export function LandingFooter({ userRole }: LandingFooterProps) {
  // Logic: Only show vendor registration for guests and clients
  const showVendorCTA = userRole !== 'VENDOR' && userRole !== 'ADMIN';

  return (
    <footer className="bg-slate-900 text-white mt-12 pb-24 lg:pb-0">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          
          {/* About Column & Footer CTA */}
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <FiShield size={18} />
              </div>
              <span className="text-sm font-black tracking-tighter">شوفلي</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed">أكبر سوق للخدمات في مصر بيجمعك بأفضل المتخصصين في ثواني.</p>
            
            {/* Quick Actions for Users */}
            <div className="space-y-3 pt-2">
              <Link href="/client/requests/new" className="flex items-center gap-2 group">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                  <FiPlusSquare size={14} />
                </div>
                <span className="text-[9px] font-black text-slate-200 group-hover:text-white transition-colors">اطلب خدمة دلوقتي</span>
              </Link>
              {showVendorCTA && (
                <Link href="/register?role=VENDOR" className="flex items-center gap-2 group">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <FiUsers size={14} />
                  </div>
                  <span className="text-[9px] font-black text-slate-300 group-hover:text-white transition-colors">سجل كمورد خدمة</span>
                </Link>
              )}
            </div>
          </div>

          {/* Links Columns */}
          {[
            {
              title: "منصة شوفلي",
              links: [
                { name: "عن شوفلي", href: "/about" },
                { name: "كيف يعمل", href: "/how-it-works" },
                { name: "أمان المعاملات", href: "/security" },
                { name: "نظام النقاط", href: "/rewards" },
              ]
            },
            {
              title: "الدعم والخصوصية",
              links: [
                { name: "شروط الاستخدام", href: "/terms" },
                { name: "سياسة الخصوصية", href: "/privacy" },
                { name: "الأسئلة الشائعة", href: "/faq" },
                { name: "مركز المساعدة", href: "/help" },
              ]
            }
          ].map((col) => (
            <div key={col.title} className="space-y-5">
              <h4 className="text-[10px] font-black text-primary border-r-2 border-primary pr-2 uppercase">{col.title}</h4>
              <ul className="space-y-3 text-xs text-slate-400">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary font-bold transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social Column */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-black text-primary border-r-2 border-primary pr-2 uppercase">تابعنا على</h4>
            <div className="flex items-center gap-3">
              {[
                { icon: FiFacebook, href: "https://facebook.com/shoofly" },
                { icon: FiTwitter, href: "https://twitter.com/shoofly" },
                { icon: FiInstagram, href: "https://instagram.com/shoofly" },
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.href} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm">
                  <social.icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 font-bold leading-relaxed">كن أول من يعرف بأحدث العروض والخدمات المضافة يومياً.</p>
          </div>

          {/* Contact Info */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-black text-primary border-r-2 border-primary pr-2 uppercase">تواصل معنا</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-center gap-2 font-bold"><FiPhone size={14} className="text-primary" /> 19XXX</li>
              <li className="flex items-center gap-2 font-bold"><FiGlobe size={14} className="text-primary" /> support@shoofly.com</li>
              <li className="flex items-center gap-2 font-bold"><FiMapPin size={14} className="text-primary" /> القاهرة، مصر</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-slate-500 font-bold">© {new Date().getFullYear()} شوفلي مصر. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "PAYMOB", color: "text-primary" },
              { label: "FAWRY", icon: true },
              { icon: FaCcVisa, label: "VISA" },
              { icon: FaCcMastercard, label: "MASTERCARD" },
            ].map((payment, i) => (
              <div key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 group hover:border-white/20 transition-colors">
                {payment.icon === true && <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,106,0,0.4)]"></div>}
                {typeof payment.icon === 'function' && <payment.icon className="text-white/90" size={14} />}
                <span className={`text-[9px] font-black ${payment.color || 'text-white/90'}`}>{payment.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
