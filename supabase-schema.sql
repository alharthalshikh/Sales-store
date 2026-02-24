-- ==========================================
-- 🛡️ السكيمة الشاملة لمتجر العسل الأصيل
-- منطق العمل: Auth Policy + Roles + Loyalty Points + Sessions
-- ==========================================

-- 1. جدول المستخدمين (المطور بالكامل)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT, -- Bcrypt Hash
    avatar_url TEXT,
    cover_url TEXT,
    address TEXT, -- عنوان الشحن الافتراضي
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'customer', -- (admin, moderator, customer)
    device_info JSONB DEFAULT '{}',
    last_location JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. جدول إدارة الجلسات (Security Policy)
-- يسمح بتعدد الأجهزة والتحكم في طرد الجلسات
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL, -- 32-byte session token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);

-- 3. جدول الأصناف (Categories)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. جدول المنتجات (Products)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image TEXT, -- الصورة الرئيسية
    images TEXT[], -- معرض الصور الإضافية
    stock INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    tags TEXT[], -- الكلمات المفتاحية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. جدول سلة التسوق (Persistent Cart)
-- لحفظ المنتجات في حساب العميل لفتحها من أي جهاز
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. جدول الطلبات (Orders Management)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_notes TEXT,
    items JSONB NOT NULL, -- [{product_id, name, quantity, price}]
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- (pending, processing, shipped, delivered, cancelled)
    payment_method TEXT DEFAULT 'cod', -- (cod: عند الاستلام, card: بطاقة إلكترونية)
    loyalty_points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. جدول الرسائل والبلاغات (Support)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'unread', -- (unread, read, replied)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. إعدادات المتجر (Store Architecture)
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name TEXT DEFAULT 'متجر العسل الأصيل',
    store_tagline TEXT DEFAULT 'من الخلية إلى بيتك... نقاء وجودة',
    currency TEXT DEFAULT 'ر.س',
    currency_symbol TEXT DEFAULT 'ر.س',
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    contact_email TEXT,
    whatsapp_number TEXT,
    terms_conditions TEXT, -- شروط وأحكام الاستخدام
    privacy_policy TEXT,
    primary_color TEXT DEFAULT '#C8860A',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. إحصائيات النظام (Real-time View)
CREATE OR REPLACE VIEW store_stats AS
SELECT 
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'delivered') as total_revenue,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM users) as total_customers;

-- ==========================================
-- ⚙️ التريجرات (Triggers) والوظائف (Functions)
-- ==========================================

-- وظيفة تحديث التوقيت تلقائياً
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_time BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_products_time BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_settings_time BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- ==========================================
-- 🔒 Row Level Security (RLS)
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- السماح للجميع برؤية المنتجات والأصناف وإعدادات المتجر
CREATE POLICY "Public View Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public View Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public View Settings" ON store_settings FOR SELECT USING (true);

-- السماح للمستخدم برؤية وتعديل بياناته فقط
CREATE POLICY "Users view self" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update self" ON users FOR UPDATE USING (id = auth.uid());

-- السماح للمدراء برؤية كل شيء
CREATE POLICY "Admins full access" ON users FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
