import { Order } from '../types';
import { StoreSettings } from '../context/StoreContextItems';
import { formatOrderId } from './formatOrderId';

export function generateInvoicePDF(order: Order, settings: StoreSettings) {
    const { storeName, storeLogo, whatsappNumber, currencySymbol } = settings;

    const itemsRows = order.items.map(item => `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${item.product.name}</td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">${item.quantity}</td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">${item.product.price.toFixed(0)} ${currencySymbol}</td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:center; font-weight:700;">${(item.product.price * item.quantity).toFixed(0)} ${currencySymbol}</td>
        </tr>
    `).join('');

    const createdDate = new Date(order.createdAt).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const statusMap: Record<string, string> = {
        pending: 'قيد الانتظار',
        processing: 'جاري التجهيز',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي',
    };

    // معالجة الشعار بناءً على نوعه
    let logoHtml = '';
    if (storeLogo) {
        if (storeLogo.startsWith('<svg')) {
            logoHtml = `<div style="width:50px; height:50px; display:flex; align-items:center; justify-content:center;">${storeLogo}</div>`;
        } else if (storeLogo.startsWith('http')) {
            logoHtml = `<img src="${storeLogo}" alt="Logo" style="width:60px; height:60px; border-radius:12px; object-fit:contain; background:#fff; padding:5px;" />`;
        } else {
            logoHtml = `<span style="font-size:2.5rem;">${storeLogo}</span>`;
        }
    }

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>فاتورة #${formatOrderId(order.id)}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f8f9fa; padding: 20px; direction: rtl; }
        .invoice { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow:hidden; }
        .invoice-header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: #fff; padding: 32px; display: flex; justify-content: space-between; align-items: center; }
        .invoice-header .brand { display: flex; align-items: center; gap: 12px; }
        .invoice-header .brand .logo { display:flex; align-items:center; justify-content:center; }
        .invoice-header .brand h1 { font-size: 1.4rem; font-weight: 800; }
        .invoice-header .invoice-info { text-align: left; }
        .invoice-header .invoice-info .invoice-num { font-size: 1.2rem; font-weight: 700; color: #C8860A; }
        .invoice-header .invoice-info .date { font-size: 0.85rem; opacity: 0.8; margin-top: 4px; }
        .invoice-body { padding: 32px; }
        .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .customer-grid .info-box { background: #f8f9fa; border-radius: 12px; padding: 16px; }
        .customer-grid .info-box h4 { color: #C8860A; font-size: 0.85rem; margin-bottom: 8px; }
        .customer-grid .info-box p { font-size: 0.9rem; line-height: 1.8; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead th { background: #1a1a2e; color: #fff; padding: 12px; font-size: 0.85rem; }
        tbody tr:nth-child(even) { background: #f8f9fa; }
        .totals { border-top: 2px solid #C8860A; padding-top: 16px; text-align: left; }
        .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 0.95rem; }
        .totals .row.grand { font-size: 1.3rem; font-weight: 800; color: #C8860A; border-top: 1px solid #eee; padding-top: 12px; margin-top: 8px; }
        .invoice-footer { background: #f8f9fa; padding: 20px 32px; text-align: center; font-size: 0.8rem; color: #888; border-top: 1px solid #eee; }
        .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        @media print {
            body { padding: 0; background: #fff; }
            .invoice { box-shadow: none; border-radius: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:center; margin-bottom:16px;">
        <button onclick="window.print()" style="padding:12px 32px; background:#C8860A; color:#fff; border:none; border-radius:12px; font-size:1rem; cursor:pointer; font-weight:700;">
            🖨️ طباعة / تحميل PDF
        </button>
    </div>

    <div class="invoice">
        <div class="invoice-header">
            <div class="brand">
                <div class="logo">${logoHtml}</div>
                <div>
                    <h1>${storeName}</h1>
                    <div style="font-size:0.8rem; opacity:0.7; margin-top:4px;">📞 ${whatsappNumber}</div>
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-num">فاتورة #${formatOrderId(order.id)}</div>
                <div class="date">${createdDate}</div>
                <div style="margin-top:8px;">
                    <span class="status-badge" style="background:${order.status === 'delivered' ? '#4CAF50' : order.status === 'cancelled' ? '#F44336' : '#FF9800'}; color:#fff;">
                        ${statusMap[order.status] || order.status}
                    </span>
                </div>
            </div>
        </div>

        <div class="invoice-body">
            <div class="customer-grid">
                <div class="info-box">
                    <h4>📋 بيانات العميل</h4>
                    <p>
                        <strong>الاسم:</strong> ${order.customerName}<br>
                        <strong>الهاتف:</strong> ${order.customerPhone}<br>
                        <strong>العنوان:</strong> ${order.customerAddress || 'غير محدد'}
                    </p>
                </div>
                <div class="info-box">
                    <h4>📦 معلومات الطلب</h4>
                    <p>
                        <strong>رقم الطلب:</strong> ${formatOrderId(order.id)}<br>
                        <strong>طريقة الدفع:</strong> ${order.paymentMethod === 'card' ? 'بطاقة' : 'الدفع عند الاستلام'}<br>
                        <strong>نقاط الولاء:</strong> 🎁 ${order.loyaltyPointsEarned || 0} نقطة
                    </p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align:right;">المنتج</th>
                        <th style="text-align:center;">الكمية</th>
                        <th style="text-align:center;">سعر الوحدة</th>
                        <th style="text-align:center;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div class="totals">
                <div class="row">
                    <span>المجموع الفرعي:</span>
                    <span>${order.items.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(0)} ${currencySymbol}</span>
                </div>
                <div class="row grand">
                    <span>المجموع الكلي:</span>
                    <span>${order.total.toFixed(0)} ${currencySymbol}</span>
                </div>
            </div>

            ${order.customerNotes ? `
            <div style="margin-top:16px; background:#fff8e1; border-radius:12px; padding:12px 16px; font-size:0.85rem;">
                <strong>📝 ملاحظات:</strong> ${order.customerNotes}
            </div>` : ''}
        </div>

        <div class="invoice-footer">
            <p>شكراً لتسوقك من ${storeName}!</p>
            <p style="margin-top:4px;">هذه الفاتورة تم إنشاؤها إلكترونياً</p>
        </div>
    </div>
</body>
</html>`;

    // Open in new window for printing/PDF save
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}
