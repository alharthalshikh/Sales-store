// ============================================================
// 📸 رفع الصور إلى Supabase Storage
// ============================================================
import { supabase } from '../lib/supabase';

const BUCKET = 'store-assets';

/**
 * ضغط الصورة قبل رفعها (باستخدام Canvas)
 */
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // تصغير الصورة إذا كانت كبيرة جداً
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('فشل ضغط الصورة'));
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => reject(new Error('فشل تحميل الصورة'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * رفع صورة إلى Supabase Storage
 * @returns رابط الصورة العام أو null
 */
export async function uploadImage(
    file: File,
    folder: string = 'products'
): Promise<string | null> {
    try {
        // console.log('🖼️ بدأت عملية ضغط الصورة...');
        // ضغط الصورة
        const compressed = await compressImage(file);
        // console.log('✅ اكتمل ضغط الصورة، جاري الرفع إلى Supabase...');

        // إنشاء اسم فريد للملف
        const ext = 'webp';
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // تحويل الـ Blob إلى File لزيادة الاستقرار
        const uploadFile = new File([compressed], 'upload.webp', { type: 'image/webp' });
        // console.log(`📦 حجم الملف النهائي: ${(uploadFile.size / 1024).toFixed(2)} KB`);

        // رفع الصورة
        // console.log(`📤 جاري رفع ملف: ${fileName} إلى bucket: ${BUCKET}`);

        const { data, error } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, uploadFile, {
                cacheControl: '3600',
                contentType: 'image/webp',
                upsert: false
            });

        if (error) {
            // console.error('❌ خطأ في رد Supabase Storage:', error);
            const errorMsg = error.message || JSON.stringify(error);
            if (errorMsg.includes('bucket_id')) {
                alert('فشل الرفع: المجلد (store-assets) غير موجود. يرجى التأكد من إنشائه في Supabase وتعيينه كـ Public.');
            } else if (errorMsg.includes('403') || errorMsg.includes('Permission')) {
                alert('فشل الرفع: لا توجد صلاحيات (Access Denied). تأكد من إعداد الـ Bucket كـ Public وإضافة سياسات RLS للرفع.');
            } else {
                alert(`فشل الرفع: ${errorMsg}`);
            }
            return null;
        }

        console.log('📦 استجابة الرفع ناجحة، جاري الحصول على الرابط...');

        // الحصول على الرابط العام
        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(data.path);

        // console.log('✅ تم رفع الصورة بنجاح:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (err: any) {
        // console.error('❌ خطأ غير متوقع في رفع الصورة:', err);
        alert(`خطأ غير متوقع: ${err.message || 'فشل الاتصال بالخادم. تأكد من جودة الإنترنت.'}`);
        return null;
    }
}

/**
 * حذف صورة من Supabase Storage
 */
export async function deleteImage(url: string): Promise<boolean> {
    try {
        // استخراج مسار الملف من الرابط
        const parts = url.split(`/storage/v1/object/public/${BUCKET}/`);
        if (parts.length < 2) return false;

        const path = parts[1];
        const { error } = await supabase.storage.from(BUCKET).remove([path]);

        if (error) {
            // console.error('❌ خطأ في حذف الصورة:', error);
            return false;
        }
        return true;
    } catch (err) {
        // console.error('❌ خطأ في حذف الصورة:', err);
        return false;
    }
}
