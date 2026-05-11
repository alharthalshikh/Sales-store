// ============================================================
// 📸 رفع الصور إلى Firebase Storage
// ============================================================
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { showToast } from '../components/ToastContainer';

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
 * رفع صورة إلى Firebase Storage
 * @returns رابط الصورة العام أو null
 */
export async function uploadImage(
    file: File,
    folder: string = 'products'
): Promise<string | null> {
    try {
        // ضغط الصورة
        const compressed = await compressImage(file);

        // إنشاء اسم فريد للملف
        const ext = 'webp';
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // تحويل الـ Blob إلى File
        const uploadFile = new File([compressed], 'upload.webp', { type: 'image/webp' });

        // رفع الصورة إلى Firebase Storage
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, uploadFile, {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=3600',
        });

        // الحصول على الرابط العام
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (err: any) {
        showToast(`خطأ في رفع الصورة: ${err.message || 'فشل الاتصال بالخادم'}`, 'error');
        return null;
    }
}

/**
 * حذف صورة من Firebase Storage
 */
export async function deleteImage(url: string): Promise<boolean> {
    try {
        // استخراج مسار الملف من الرابط
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
        return true;
    } catch (err) {
        return false;
    }
}
