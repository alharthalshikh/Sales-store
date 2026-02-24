-- 1. تنظيف السياسات القديمة
DROP POLICY IF EXISTS "Admins full access on users" ON users;
DROP POLICY IF EXISTS "Users view self" ON users;
DROP POLICY IF EXISTS "Users update self" ON users;
DROP POLICY IF EXISTS "Admins full access on customers" ON customers;
DROP POLICY IF EXISTS "Customers view self" ON customers;
DROP POLICY IF EXISTS "Customers update self" ON customers;

-- 2. إعداد الجداول (تأكد من النوع UUID لـ user_id)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    device_info JSONB DEFAULT '{}',
    last_location JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. سياسات الحماية الجديدة مع حل مشكلة تعارض الأنواع (text vs uuid)
-- نستخدم casting صريح ::uuid و ::text لضمان عمل المقارنة في كل الحالات

-- مسموح للمدراء (Admins) بكل شيء
-- نتحقق من جدول admins باستخدام casting لضمان التوافق
CREATE POLICY "Admins full access on users" ON users 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE user_id::text = auth.uid()::text
    )
);

CREATE POLICY "Admins full access on customers" ON customers 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE user_id::text = auth.uid()::text
    )
);

-- مسموح للمستخدم رؤية وتعديل بياناته فقط
-- نستخدم casting لضمان التوافق: [id::text = auth.uid()::text]
CREATE POLICY "Users view self" ON users FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Users update self" ON users FOR UPDATE USING (id::text = auth.uid()::text);
CREATE POLICY "Customers view self" ON customers FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Customers update self" ON customers FOR UPDATE USING (id::text = auth.uid()::text);
