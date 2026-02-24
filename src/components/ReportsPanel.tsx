import React, { useState } from 'react';
import { Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { Order } from '../types';

type ReportView = 'dashboard' | 'daily' | 'weekly' | 'monthly' | 'annual';

const cardStyle: React.CSSProperties = { background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' };
const kpiStyle = (color: string): React.CSSProperties => ({ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 6 });
const sectionTitle: React.CSSProperties = { marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', fontWeight: 700 };

export default function ReportsPanel() {
    const { state } = useStore();
    const s = state.settings;
    const [view, setView] = useState<ReportView>('dashboard');
    const [showMenu, setShowMenu] = useState(false);
    const cur = s.currencySymbol;

    // =================== HELPER FUNCTIONS ===================
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfDay - 86400000;
    const startOfWeek = startOfDay - (now.getDay() * 86400000);
    const startOfLastWeek = startOfWeek - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const filterOrders = (from: number, to?: number) => state.orders.filter(o => o.createdAt >= from && (!to || o.createdAt < to));
    const delivered = (orders: Order[]) => orders.filter(o => o.status === 'delivered');
    const cancelled = (orders: Order[]) => orders.filter(o => o.status === 'cancelled');
    const revenue = (orders: Order[]) => orders.reduce((s, o) => s + o.total, 0);
    const avgOrder = (orders: Order[]) => orders.length ? revenue(orders) / orders.length : 0;

    const getProductSales = (orders: Order[]) => {
        const map: Record<string, { name: string; qty: number; rev: number }> = {};
        delivered(orders).forEach(o => o.items.forEach(it => {
            if (!map[it.product.id]) map[it.product.id] = { name: it.product.name, qty: 0, rev: 0 };
            map[it.product.id].qty += it.quantity;
            map[it.product.id].rev += it.product.price * it.quantity;
        }));
        return Object.values(map).sort((a, b) => b.qty - a.qty);
    };

    const getCategorySales = (orders: Order[]) => {
        const map: Record<string, { name: string; qty: number; rev: number }> = {};
        delivered(orders).forEach(o => o.items.forEach(it => {
            const cat = state.categories.find(c => c.id === it.product.categoryId);
            const key = it.product.categoryId || 'none';
            if (!map[key]) map[key] = { name: cat ? `${cat.icon} ${cat.name}` : 'عام', qty: 0, rev: 0 };
            map[key].qty += it.quantity;
            map[key].rev += it.product.price * it.quantity;
        }));
        return Object.values(map).sort((a, b) => b.rev - a.rev);
    };

    const getCustomerStats = (orders: Order[]) => {
        const map: Record<string, { name: string; total: number; count: number }> = {};
        delivered(orders).forEach(o => {
            const key = o.customerName;
            if (!map[key]) map[key] = { name: key, total: 0, count: 0 };
            map[key].total += o.total;
            map[key].count += 1;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    };

    const pct = (current: number, previous: number) => previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous * 100);

    const lowStock = state.products.filter(p => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 5));
    const outOfStock = state.products.filter(p => (p.stockQuantity ?? 0) <= 0);
    const stockValue = state.products.reduce((s, p) => s + (p.price * (p.stockQuantity || 0)), 0);

    // =================== KPI CARD ===================
    const KPI = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) => (
        <div style={kpiStyle(color || 'var(--accent)')}>
            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: color || 'var(--accent)' }}>{value}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
            {sub && <span style={{ fontSize: '0.75rem', color: '#999' }}>{sub}</span>}
        </div>
    );

    const GrowthBadge = ({ val }: { val: number }) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700, color: val >= 0 ? '#4CAF50' : '#f44336', background: val >= 0 ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)', padding: '3px 10px', borderRadius: 50 }}>
            {val >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(val).toFixed(0)}%
        </span>
    );

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div style={cardStyle}><h4 style={sectionTitle}>{title}</h4>{children}</div>
    );

    const Table = ({ heads, rows }: { heads: string[]; rows: React.ReactNode[][] }) => (
        <table className="admin-table" style={{ width: '100%' }}>
            <thead><tr>{heads.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{rows.length > 0 ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ fontWeight: j === 0 ? 700 : 400 }}>{c}</td>)}</tr>) : <tr><td colSpan={heads.length} style={{ textAlign: 'center', padding: 30, color: '#999' }}>لا توجد بيانات</td></tr>}</tbody>
        </table>
    );

    // =================== NAV BAR ===================
    const navBtns: { id: ReportView; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'لوحة القيادة', icon: '📊' },
        { id: 'daily', label: 'يومي', icon: '📝' },
        { id: 'weekly', label: 'أسبوعي', icon: '📅' },
        { id: 'monthly', label: 'شهري', icon: '🏢' },
        { id: 'annual', label: 'سنوي', icon: '🏦' },
    ];

    // =================== DASHBOARD ===================
    const renderDashboard = () => {
        const todayOrders = filterOrders(startOfDay);
        const yesterdayOrders = filterOrders(startOfYesterday, startOfDay);
        const lastWeekSameDayOrders = filterOrders(startOfDay - 7 * 86400000, startOfDay - 6 * 86400000);
        const todayDel = delivered(todayOrders);
        const yesterDel = delivered(yesterdayOrders);
        const todayRev = revenue(todayDel);
        const yesterRev = revenue(yesterDel);
        const growthVsYesterday = pct(todayRev, yesterRev);
        const growthVsLastWeek = pct(todayRev, revenue(delivered(lastWeekSameDayOrders)));
        const todayProductSales = getProductSales(todayOrders);
        const customers = getCustomerStats(state.orders);
        const allDelivered = delivered(state.orders);
        const uniqueCustomers = new Set(allDelivered.map(o => o.customerName)).size;
        const repeatCustomers = customers.filter(c => c.count > 1);

        return (<>
            {/* القسم المالي */}
            <Section title="🔹 المؤشرات المالية">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                    <KPI icon="💰" label="مبيعات اليوم" value={`${todayRev.toFixed(0)} ${cur}`} color="#4CAF50" />
                    <KPI icon="📦" label="طلبات اليوم" value={todayOrders.length} />
                    <KPI icon="🧮" label="متوسط قيمة الطلب" value={`${avgOrder(todayDel).toFixed(0)} ${cur}`} />
                    <KPI icon="📈" label="نمو vs أمس" value={`${growthVsYesterday >= 0 ? '+' : ''}${growthVsYesterday.toFixed(0)}%`} color={growthVsYesterday >= 0 ? '#4CAF50' : '#f44336'} />
                    <KPI icon="📊" label="نمو vs الأسبوع الماضي" value={`${growthVsLastWeek >= 0 ? '+' : ''}${growthVsLastWeek.toFixed(0)}%`} color={growthVsLastWeek >= 0 ? '#4CAF50' : '#f44336'} />
                    <KPI icon="❌" label="طلبات ملغاة اليوم" value={cancelled(todayOrders).length} color="#f44336" />
                </div>
            </Section>

            {/* قسم المخزون */}
            <Section title="🔹 حالة المخزون">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
                    <KPI icon="🚫" label="منتجات نفدت" value={outOfStock.length} color="#f44336" />
                    <KPI icon="⚠️" label="مخزون منخفض" value={lowStock.length} color="#FF9800" />
                    <KPI icon="🏗️" label="قيمة المخزون" value={`${stockValue.toFixed(0)} ${cur}`} color="#2196F3" />
                </div>
                {todayProductSales.length > 0 && <>
                    <h5 style={{ margin: '10px 0' }}>أفضل 5 منتجات مبيعاً اليوم</h5>
                    <Table heads={['المنتج', 'الكمية', 'الإيرادات']} rows={todayProductSales.slice(0, 5).map(p => [p.name, p.qty, `${p.rev.toFixed(0)} ${cur}`])} />
                </>}
            </Section>

            {/* قسم العملاء */}
            <Section title="🔹 العملاء">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                    <KPI icon="👥" label="إجمالي العملاء" value={uniqueCustomers} />
                    <KPI icon="🔁" label="عملاء عائدون" value={repeatCustomers.length} color="#9C27B0" />
                    <KPI icon="👑" label="أعلى عميل شراءً" value={customers[0]?.name || '-'} sub={customers[0] ? `${customers[0].total.toFixed(0)} ${cur}` : ''} />
                    <KPI icon="📊" label="متوسط تكرار الشراء" value={uniqueCustomers ? (allDelivered.length / uniqueCustomers).toFixed(1) : '0'} />
                </div>
            </Section>
        </>);
    };

    // =================== DAILY REPORT ===================
    const renderDaily = () => {
        const orders = filterOrders(startOfDay);
        const del = delivered(orders);
        const canc = cancelled(orders);
        const rev = revenue(del);
        const sales = getProductSales(orders);
        const unsold = state.products.filter(p => !sales.find(s => s.name === p.name));

        return (<>
            <Section title="1️⃣ ملخص مالي لليوم">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <KPI icon="💰" label="إجمالي المبيعات" value={`${rev.toFixed(0)} ${cur}`} color="#4CAF50" />
                    <KPI icon="📦" label="عدد الطلبات" value={orders.length} />
                    <KPI icon="✅" label="طلبات مكتملة" value={del.length} />
                    <KPI icon="🧮" label="متوسط قيمة الطلب" value={`${avgOrder(del).toFixed(0)} ${cur}`} />
                </div>
            </Section>

            <Section title="2️⃣ حركة المنتجات">
                <Table heads={['المنتج', 'الكمية المباعة', 'الإيرادات']} rows={sales.slice(0, 10).map(p => [p.name, p.qty, `${p.rev.toFixed(0)} ${cur}`])} />
                {unsold.length > 0 && <><h5 style={{ margin: '16px 0 8px', color: '#FF9800' }}>⚠️ منتجات لم تُباع اليوم ({unsold.length})</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{unsold.map(p => <span key={p.id} style={{ padding: '4px 12px', background: 'rgba(255,152,0,0.1)', borderRadius: 20, fontSize: '0.85rem' }}>{p.name}</span>)}</div></>}
            </Section>

            <Section title="3️⃣ العملاء والمشاكل">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <KPI icon="❌" label="طلبات ملغاة" value={canc.length} color="#f44336" />
                    <KPI icon="⏳" label="طلبات قيد الانتظار" value={orders.filter(o => o.status === 'pending').length} color="#FF9800" />
                </div>
            </Section>

            {/* قائمة طلبات اليوم */}
            <Section title="4️⃣ سجل طلبات اليوم">
                <Table heads={['رقم الطلب', 'العميل', 'الوقت', 'المبلغ', 'الحالة']}
                    rows={orders.map(o => [
                        `#${o.id.slice(-6).toUpperCase()}`,
                        o.customerName,
                        new Date(o.createdAt).toLocaleTimeString('ar-SA'),
                        `${o.total.toFixed(0)} ${cur}`,
                        o.status === 'delivered' ? '✅' : o.status === 'cancelled' ? '❌' : '⏳'
                    ])} />
            </Section>
        </>);
    };

    // =================== WEEKLY REPORT ===================
    const renderWeekly = () => {
        const thisWeek = filterOrders(startOfWeek);
        const lastWeek = filterOrders(startOfLastWeek, startOfWeek);
        const thisRev = revenue(delivered(thisWeek));
        const lastRev = revenue(delivered(lastWeek));
        const growth = pct(thisRev, lastRev);
        const sales = getProductSales(thisWeek);
        const catSales = getCategorySales(thisWeek);
        const customers = getCustomerStats(thisWeek);

        return (<>
            <Section title="1️⃣ مقارنة أسبوعية">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <KPI icon="💰" label="مبيعات هذا الأسبوع" value={`${thisRev.toFixed(0)} ${cur}`} color="#4CAF50" />
                    <KPI icon="📉" label="مبيعات الأسبوع الماضي" value={`${lastRev.toFixed(0)} ${cur}`} />
                    <KPI icon="📊" label="نسبة النمو" value={`${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`} color={growth >= 0 ? '#4CAF50' : '#f44336'} />
                    <KPI icon="📦" label="طلبات مكتملة" value={delivered(thisWeek).length} />
                </div>
            </Section>

            <Section title="2️⃣ أداء المنتجات (Top 10)">
                <Table heads={['المنتج', 'الكمية', 'الإيرادات']} rows={sales.slice(0, 10).map(p => [p.name, p.qty, `${p.rev.toFixed(0)} ${cur}`])} />
            </Section>

            <Section title="3️⃣ أداء الأصناف">
                <Table heads={['الصنف', 'القطع المباعة', 'الإيرادات']} rows={catSales.map(c => [c.name, c.qty, `${c.rev.toFixed(0)} ${cur}`])} />
            </Section>

            <Section title="4️⃣ تحليل العملاء">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                    <KPI icon="👥" label="عملاء الأسبوع" value={customers.length} />
                    <KPI icon="🔁" label="عملاء متكررون" value={customers.filter(c => c.count > 1).length} color="#9C27B0" />
                    <KPI icon="🧮" label="متوسط إنفاق العميل" value={`${customers.length ? (revenue(delivered(thisWeek)) / customers.length).toFixed(0) : 0} ${cur}`} />
                </div>
                {customers.length > 0 && <Table heads={['العميل', 'عدد الطلبات', 'إجمالي الإنفاق']} rows={customers.slice(0, 5).map(c => [c.name, c.count, `${c.total.toFixed(0)} ${cur}`])} />}
            </Section>
        </>);
    };

    // =================== MONTHLY REPORT ===================
    const renderMonthly = () => {
        const monthOrders = filterOrders(startOfMonth);
        const monthDel = delivered(monthOrders);
        const monthRev = revenue(monthDel);
        const sales = getProductSales(monthOrders);
        const catSales = getCategorySales(monthOrders);
        const customers = getCustomerStats(monthOrders);
        const slowProducts = state.products.filter(p => !sales.find(s => s.name === p.name));
        const totalItems = sales.reduce((s, p) => s + p.qty, 0);
        const margin = monthRev > 0 ? ((monthRev * 0.3) / monthRev * 100) : 0; // تقدير هامش 30%

        return (<>
            <Section title="1️⃣ تحليل مالي عميق">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <KPI icon="💰" label="إجمالي الإيرادات" value={`${monthRev.toFixed(0)} ${cur}`} color="#4CAF50" />
                    <KPI icon="📦" label="طلبات مكتملة" value={monthDel.length} />
                    <KPI icon="🛍️" label="قطع مباعة" value={totalItems} color="#2196F3" />
                    <KPI icon="🧮" label="متوسط قيمة الطلب" value={`${avgOrder(monthDel).toFixed(0)} ${cur}`} />
                    <KPI icon="📊" label="هامش الربح (تقديري)" value={`${margin.toFixed(0)}%`} sub="يعتمد على إعدادات التكلفة" color="#FF9800" />
                </div>
            </Section>

            <Section title="2️⃣ تحليل المخزون">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                    <KPI icon="🏗️" label="قيمة المخزون الحالي" value={`${stockValue.toFixed(0)} ${cur}`} color="#2196F3" />
                    <KPI icon="🚫" label="منتجات نافدة" value={outOfStock.length} color="#f44336" />
                    <KPI icon="🐢" label="منتجات راكدة (لم تُباع)" value={slowProducts.length} color="#FF9800" />
                </div>
                <Table heads={['المنتج', 'المخزون الحالي', 'قيمة المخزون', 'الحالة']}
                    rows={state.products.map(p => {
                        const q = p.stockQuantity ?? 0;
                        const status = q <= 0 ? '🚫 نفد' : q <= (p.lowStockThreshold ?? 5) ? '⚠️ منخفض' : '✅ جيد';
                        return [p.name, q, `${(q * p.price).toFixed(0)} ${cur}`, status];
                    })} />
            </Section>

            <Section title="3️⃣ أفضل المنتجات مبيعاً">
                <Table heads={['#', 'المنتج', 'الكمية', 'الإيرادات']} rows={sales.slice(0, 10).map((p, i) => [i + 1, p.name, p.qty, `${p.rev.toFixed(0)} ${cur}`])} />
            </Section>

            <Section title="4️⃣ المبيعات حسب الصنف">
                <Table heads={['الصنف', 'القطع', 'الإيرادات', 'النسبة']} rows={catSales.map(c => [c.name, c.qty, `${c.rev.toFixed(0)} ${cur}`, `${monthRev > 0 ? (c.rev / monthRev * 100).toFixed(0) : 0}%`])} />
            </Section>

            <Section title="5️⃣ تحليل العملاء">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                    <KPI icon="👥" label="عملاء الشهر" value={customers.length} />
                    <KPI icon="🔁" label="عملاء عائدون" value={customers.filter(c => c.count > 1).length} color="#9C27B0" />
                    <KPI icon="👑" label="أعلى عميل" value={customers[0]?.name || '-'} sub={customers[0] ? `${customers[0].total.toFixed(0)} ${cur}` : ''} />
                </div>
            </Section>
        </>);
    };

    // =================== ANNUAL REPORT ===================
    const renderAnnual = () => {
        const yearOrders = filterOrders(startOfYear);
        const yearDel = delivered(yearOrders);
        const yearRev = revenue(yearDel);
        const catSales = getCategorySales(yearOrders);
        const customers = getCustomerStats(yearOrders);

        // أفضل وأسوأ شهر
        const monthlyRevs: { month: string; rev: number }[] = [];
        for (let m = 0; m <= now.getMonth(); m++) {
            const mStart = new Date(now.getFullYear(), m, 1).getTime();
            const mEnd = new Date(now.getFullYear(), m + 1, 1).getTime();
            const mOrders = state.orders.filter(o => o.createdAt >= mStart && o.createdAt < mEnd && o.status === 'delivered');
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            monthlyRevs.push({ month: monthNames[m], rev: mOrders.reduce((s, o) => s + o.total, 0) });
        }
        const bestMonth = [...monthlyRevs].sort((a, b) => b.rev - a.rev)[0];
        const worstMonth = [...monthlyRevs].sort((a, b) => a.rev - b.rev)[0];

        return (<>
            <Section title="1️⃣ الأداء المالي السنوي">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <KPI icon="💰" label="إجمالي الإيرادات" value={`${yearRev.toFixed(0)} ${cur}`} color="#4CAF50" />
                    <KPI icon="📦" label="إجمالي الطلبات المكتملة" value={yearDel.length} />
                    <KPI icon="🏗️" label="قيمة الأصول (المخزون)" value={`${stockValue.toFixed(0)} ${cur}`} color="#2196F3" />
                    <KPI icon="🏛️" label="المركز المالي الكلي" value={`${(yearRev + stockValue).toFixed(0)} ${cur}`} color="#9C27B0" />
                </div>
            </Section>

            <Section title="2️⃣ تحليل الاتجاهات (شهرياً)">
                <Table heads={['الشهر', 'الإيرادات']} rows={monthlyRevs.map(m => [m.month, `${m.rev.toFixed(0)} ${cur}`])} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                    <KPI icon="🏆" label="أفضل شهر" value={bestMonth?.month || '-'} sub={`${bestMonth?.rev.toFixed(0) || 0} ${cur}`} color="#4CAF50" />
                    <KPI icon="📉" label="أضعف شهر" value={worstMonth?.month || '-'} sub={`${worstMonth?.rev.toFixed(0) || 0} ${cur}`} color="#f44336" />
                </div>
            </Section>

            <Section title="3️⃣ تحليل السوق والأصناف">
                <Table heads={['الصنف', 'القطع المباعة', 'الإيرادات', 'النسبة']}
                    rows={catSales.map(c => [c.name, c.qty, `${c.rev.toFixed(0)} ${cur}`, `${yearRev > 0 ? (c.rev / yearRev * 100).toFixed(0) : 0}%`])} />
            </Section>

            <Section title="4️⃣ تحليل العملاء طويل المدى">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                    <KPI icon="👥" label="إجمالي العملاء" value={customers.length} />
                    <KPI icon="🔁" label="نسبة الاحتفاظ (عائدون)" value={`${customers.length ? (customers.filter(c => c.count > 1).length / customers.length * 100).toFixed(0) : 0}%`} color="#9C27B0" />
                    <KPI icon="💎" label="متوسط قيمة العميل (LTV)" value={`${customers.length ? (yearRev / customers.length).toFixed(0) : 0} ${cur}`} color="#FF9800" />
                </div>
                {customers.length > 0 && <><h5 style={{ margin: '10px 0' }}>أفضل 10 عملاء</h5>
                    <Table heads={['العميل', 'عدد الطلبات', 'إجمالي الإنفاق']} rows={customers.slice(0, 10).map(c => [c.name, c.count, `${c.total.toFixed(0)} ${cur}`])} /></>}
            </Section>
        </>);
    };

    // =================== MAIN RENDER ===================
    const viewTitles: Record<ReportView, string> = {
        dashboard: '📊 لوحة القيادة (Dashboard)',
        daily: '📝 التقرير اليومي',
        weekly: '📅 التقرير الأسبوعي',
        monthly: '🏢 التقرير الشهري',
        annual: '🏦 التقرير السنوي',
    };

    return (
        <div style={{ display: 'grid', gap: 24 }} className="reports-page">
            <style>{`
                @media print {
                    .admin-sidebar, .no-print { display: none !important; }
                    .admin-layout { grid-template-columns: 1fr !important; }
                    body { background: white !important; color: black !important; }
                    .reports-page { padding: 20px !important; }
                }
            `}</style>

            {/* شريط التنقل */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {navBtns.map(b => {
                        const isActive = view === b.id;
                        return (
                            <button
                                key={b.id}
                                onClick={() => setView(b.id)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 50,
                                    // إذا كان التقرير نشطاً نستخدم لون الأكسنت، وإذا لم يكن نستخدم خلفية السطح
                                    background: isActive ? 'var(--accent)' : 'var(--surface)',
                                    // لون النص يميل للأسود إذا كانت خلفية الأكسنت فاتحة (للوضوح)
                                    color: isActive ? '#000' : 'var(--text)',
                                    border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 0.2s ease',
                                    // إضافة ظل خفيف للزر النشط لزيادة البروز
                                    boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                                    filter: isActive ? 'none' : 'grayscale(0.5) opacity(0.8)'
                                }}>
                                <span style={{ fontSize: '1.1rem' }}>{b.icon}</span>
                                {b.label}
                            </button>
                        );
                    })}
                </div>
                <button className="btn btn-primary" style={{ gap: 8, padding: '10px 24px', borderRadius: 50, fontWeight: 700 }} onClick={() => window.print()}>
                    <Printer size={18} /> طباعة التقرير
                </button>
            </div>

            {/* عنوان التقرير */}
            <div style={{ borderBottom: '2px solid var(--accent)', paddingBottom: 12 }}>
                <h2>{viewTitles[view]}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.storeName} — {new Date().toLocaleDateString('ar-SA')}</p>
            </div>

            {/* المحتوى */}
            {view === 'dashboard' && renderDashboard()}
            {view === 'daily' && renderDaily()}
            {view === 'weekly' && renderWeekly()}
            {view === 'monthly' && renderMonthly()}
            {view === 'annual' && renderAnnual()}

            {/* توقيعات (طباعة فقط) */}
            <div style={{ marginTop: 60, display: 'none', justifyContent: 'space-between', padding: '0 40px' }} className="print-footer">
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700 }}>إعداد المسؤول</p>
                    <div style={{ borderBottom: '2px dashed #ccc', width: 200, height: 40 }}></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700 }}>اعتماد الإدارة</p>
                    <div style={{ borderBottom: '2px dashed #ccc', width: 200, height: 40 }}></div>
                </div>
                <style>{`@media print { .print-footer { display: flex !important; } }`}</style>
            </div>
        </div>
    );
}
