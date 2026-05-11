// ============================================================
// 📸 رفع الصور إلى Firebase Storage
// ============================================================
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { showToast } from '../components/ToastContainer';

/**
 * تحويل الصورة إلى Base64 مع الضغط
 * يتم استخدام هذه الطريقة لتجنب مشاكل CORS في Firebase Storage
 */
async function compressToBase64(file: File, maxWidth = 800, quality = 0.6): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // تصغير الصورة لضمان عدم تجاوز حجم وثيقة Firestore (1MB)
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            // تحويل إلى base64 بصيغة webp لتقليل الحجم
            const base64 = canvas.toDataURL('image/webp', quality);
            resolve(base64);
        };

        img.onerror = () => reject(new Error('فشل تحميل الصورة'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * معالجة الصورة وإرجاعها كـ Base64
 * @returns سلسلة base64 أو null
 */
export async function uploadImage(
    file: File,
    _folder: string = 'products'
): Promise<string | null> {
    try {
        // تحويل الصورة إلى base64 مضغوط
        const base64 = await compressToBase64(file);
        return base64;
    } catch (err: any) {
        showToast(`خطأ في معالجة الصورة: ${err.message || 'فشل الاتصال'}`, 'error');
        return null;
    }
}

/**
 * حذف صورة (لم تعد مطلوبة لأن الصور مخزنة كنصوص)
 */
export async function deleteImage(_url: string): Promise<boolean> {
    return true;
}
