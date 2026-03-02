/**
 * توحيد عرض رقم الطلب في كل المتجر
 * يأخذ UUID الطلب ويرجع صيغة قابلة للقراءة: ORD-XXXXXXXX
 */
export function formatOrderId(id: string): string {
    if (!id) return '';
    // أخذ أول 8 أحرف من الـ UUID (الجزء الأول قبل أول -)
    const shortId = id.split('-')[0].toUpperCase();
    return `ORD-${shortId}`;
}
