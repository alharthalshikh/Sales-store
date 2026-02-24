// ============================================================
// 🎨 ملف الثيم الرئيسي - غيّر هذا الملف لتحويل المتجر بالكامل
// ============================================================
// غيّر storeType إلى أي نوع متجر تريده:
// 'honey' | 'perfume' | 'beauty' | 'clinic' | 'homeware' | 'custom'

export type StoreType = 'honey' | 'perfume' | 'beauty' | 'clinic' | 'homeware' | 'custom';

export interface ThemeConfig {
    storeType: StoreType;
    storeName: string;
    storeNameEn: string;
    storeDescription: string;
    storeTagline: string;
    storeLogo: string;
    whatsappNumber: string; // رقم الواتساب لإرسال الطلبات
    currency: string;
    currencySymbol: string;
    colors: {
        primary: string;
        primaryLight: string;
        primaryDark: string;
        secondary: string;
        secondaryLight: string;
        accent: string;
        accentGlow: string;
        background: string;
        backgroundAlt: string;
        surface: string;
        surfaceHover: string;
        text: string;
        textSecondary: string;
        textLight: string;
        border: string;
        success: string;
        warning: string;
        error: string;
        gradient: string;
        gradientAlt: string;
        heroOverlay: string;
    };
    heroImage: string;
    aboutImage: string;
    features: string[];
}

// ============================================================
// 🍯 ثيم متجر العسل
// ============================================================
const honeyTheme: ThemeConfig = {
    storeType: 'honey',
    storeName: 'أرض الجنتين',
    storeNameEn: 'Ardh Al-Jannatayn',
    storeDescription: 'أجود أنواع العسل الطبيعي، التمور الفاخرة، والعطور العربية الأصيلة - بإشراف الحارث (Alharth)',
    storeTagline: 'أرض الجنتين... جودة ونقاء بإشراف الحارث (Alharth)',
    storeLogo: 'https://gxxnuxowzufouzfzoxun.supabase.co/storage/v1/object/public/store-assets/settings/1771717035634-181c99.webp',
    whatsappNumber: '966500000000',
    currency: 'ريال',
    currencySymbol: 'ر.س',
    colors: {
        primary: '#C8860A',
        primaryLight: '#E5A820',
        primaryDark: '#8B5E0B',
        secondary: '#5C3D0E',
        secondaryLight: '#7A5523',
        accent: '#FFD700',
        accentGlow: 'rgba(255, 215, 0, 0.3)',
        background: '#0D0A06',
        backgroundAlt: '#1A1408',
        surface: '#1E1710',
        surfaceHover: '#2A2018',
        text: '#F5E6C8',
        textSecondary: '#C4A87A',
        textLight: '#8B7355',
        border: 'rgba(200, 134, 10, 0.2)',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        gradient: 'linear-gradient(135deg, #C8860A 0%, #FFD700 50%, #E5A820 100%)',
        gradientAlt: 'linear-gradient(135deg, #1A1408 0%, #2A2018 100%)',
        heroOverlay: 'linear-gradient(135deg, rgba(13,10,6,0.85) 0%, rgba(26,20,8,0.7) 50%, rgba(200,134,10,0.15) 100%)',
    },
    heroImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1920&q=80',
    aboutImage: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
    features: ['عسل طبيعي 100%', 'شحن سريع', 'ضمان الجودة', 'أسعار منافسة'],
};

// ============================================================
// 🌸 ثيم متجر العناية والجمال
// ============================================================
const beautyTheme: ThemeConfig = {
    storeType: 'beauty',
    storeName: 'بيوتي كير',
    storeNameEn: 'Beauty Care',
    storeDescription: 'أفضل منتجات العناية بالبشرة والشعر والجسم',
    storeTagline: 'جمالك يبدأ من هنا',
    storeLogo: '🌸',
    whatsappNumber: '966500000000',
    currency: 'ريال',
    currencySymbol: 'ر.س',
    colors: {
        primary: '#E91E8C',
        primaryLight: '#FF5CAD',
        primaryDark: '#B5006B',
        secondary: '#6A1B5E',
        secondaryLight: '#8E3A7D',
        accent: '#FF80CB',
        accentGlow: 'rgba(255, 128, 203, 0.3)',
        background: '#0A060A',
        backgroundAlt: '#140E14',
        surface: '#1A121A',
        surfaceHover: '#241A24',
        text: '#F5E0F0',
        textSecondary: '#C4A0BB',
        textLight: '#8B6580',
        border: 'rgba(233, 30, 140, 0.2)',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        gradient: 'linear-gradient(135deg, #E91E8C 0%, #FF80CB 50%, #FF5CAD 100%)',
        gradientAlt: 'linear-gradient(135deg, #140E14 0%, #241A24 100%)',
        heroOverlay: 'linear-gradient(135deg, rgba(10,6,10,0.85) 0%, rgba(20,14,20,0.7) 50%, rgba(233,30,140,0.15) 100%)',
    },
    heroImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&q=80',
    aboutImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
    features: ['منتجات أصلية', 'شحن مجاني', 'استشارة مجانية', 'ماركات عالمية'],
};

// ============================================================
// 🏥 ثيم عيادة منزلية
// ============================================================
const clinicTheme: ThemeConfig = {
    storeType: 'clinic',
    storeName: 'عيادتي المنزلية',
    storeNameEn: 'My Home Clinic',
    storeDescription: 'خدمات طبية وصحية في راحة منزلك',
    storeTagline: 'صحتك أولويتنا',
    storeLogo: '🏥',
    whatsappNumber: '966500000000',
    currency: 'ريال',
    currencySymbol: 'ر.س',
    colors: {
        primary: '#00BCD4',
        primaryLight: '#4DD0E1',
        primaryDark: '#0097A7',
        secondary: '#006064',
        secondaryLight: '#26838A',
        accent: '#80DEEA',
        accentGlow: 'rgba(128, 222, 234, 0.3)',
        background: '#060A0B',
        backgroundAlt: '#0E1416',
        surface: '#121A1C',
        surfaceHover: '#1A2426',
        text: '#E0F5F8',
        textSecondary: '#A0C4CA',
        textLight: '#658A90',
        border: 'rgba(0, 188, 212, 0.2)',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        gradient: 'linear-gradient(135deg, #00BCD4 0%, #80DEEA 50%, #4DD0E1 100%)',
        gradientAlt: 'linear-gradient(135deg, #0E1416 0%, #1A2426 100%)',
        heroOverlay: 'linear-gradient(135deg, rgba(6,10,11,0.85) 0%, rgba(14,20,22,0.7) 50%, rgba(0,188,212,0.15) 100%)',
    },
    heroImage: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1920&q=80',
    aboutImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
    features: ['أطباء متخصصون', 'زيارات منزلية', 'تقارير طبية', 'متابعة مستمرة'],
};

// ============================================================
// 🏠 ثيم أدوات منزلية
// ============================================================
const homewareTheme: ThemeConfig = {
    storeType: 'homeware',
    storeName: 'بيت الأدوات',
    storeNameEn: 'Home Tools',
    storeDescription: 'كل ما تحتاجه لمنزلك من أدوات ومستلزمات',
    storeTagline: 'بيتك أجمل معنا',
    storeLogo: '🏠',
    whatsappNumber: '966500000000',
    currency: 'ريال',
    currencySymbol: 'ر.س',
    colors: {
        primary: '#FF6F00',
        primaryLight: '#FF9100',
        primaryDark: '#E65100',
        secondary: '#4E342E',
        secondaryLight: '#6D4C41',
        accent: '#FFB74D',
        accentGlow: 'rgba(255, 183, 77, 0.3)',
        background: '#0A0806',
        backgroundAlt: '#14100E',
        surface: '#1A1614',
        surfaceHover: '#24201E',
        text: '#F5EDE5',
        textSecondary: '#C4B4A4',
        textLight: '#8B7B6B',
        border: 'rgba(255, 111, 0, 0.2)',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        gradient: 'linear-gradient(135deg, #FF6F00 0%, #FFB74D 50%, #FF9100 100%)',
        gradientAlt: 'linear-gradient(135deg, #14100E 0%, #24201E 100%)',
        heroOverlay: 'linear-gradient(135deg, rgba(10,8,6,0.85) 0%, rgba(20,16,14,0.7) 50%, rgba(255,111,0,0.15) 100%)',
    },
    heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
    aboutImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    features: ['جودة عالية', 'أسعار مخفضة', 'توصيل سريع', 'ضمان المنتجات'],
};

// ============================================================
// ⭐ اختيار الثيم النشط - غيّر هنا فقط لتغيير شكل المتجر بالكامل
// ============================================================
const themes: Record<StoreType, ThemeConfig> = {
    honey: honeyTheme,
    perfume: honeyTheme, // يمكنك إنشاء ثيم خاص بالعطور
    beauty: beautyTheme,
    clinic: clinicTheme,
    homeware: homewareTheme,
    custom: honeyTheme,
};

// 👇 غيّر هذا السطر لتغيير الثيم بالكامل
export const ACTIVE_THEME: StoreType = 'honey';

export const theme: ThemeConfig = themes[ACTIVE_THEME];

export default theme;
