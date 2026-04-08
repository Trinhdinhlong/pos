"use client";
import React, { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/apiClient";
import { 
    TrendingUp, 
    ShoppingBag, 
    Trophy,
    Activity,
    LineChart as LineChartIcon,
    CreditCard,
    Banknote,
    Zap,
    Grid2X2,
    Loader2
} from "lucide-react";

// --- Custom Modern Chart Components ---

const ModernDonutChart = ({ data, title, icon: Icon, showCenter = true }: { data: { label: string; value: number; color: string }[], title: string, icon: any, showCenter?: boolean }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
        <div className="group bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center">
            <h5 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] mb-10 sm:mb-14 text-zinc-500 flex items-center gap-2 group-hover:text-zinc-900 dark:group-hover:text-emerald-500 transition-colors">
               <Icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 group-hover:rotate-12 transition-all" /> {title}
            </h5>
            {total === 0 ? (
                <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border-4 border-dashed border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-300 uppercase italic">Chưa có dữ liệu</div>
            ) : (
                <div className="relative w-40 h-40 sm:w-56 sm:h-56 mb-8 sm:mb-12 transform group-hover:scale-105 transition-transform duration-500">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {data.map((item, i) => {
                            const percentage = (item.value / total) * 100;
                            const angle = (percentage / 100) * 360;
                            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                            currentAngle += angle;
                            const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                            const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                            const largeArcFlag = percentage > 50 ? 1 : 0;
                            const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                            return <path key={i} d={d} fill={item.color} className="transition-all duration-300 hover:opacity-80" stroke="white" strokeWidth="0.5" />;
                        })}
                        <circle cx="50" cy="50" r="32" fill="currentColor" className="text-white dark:text-zinc-900" />
                    </svg>
                    {showCenter && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                            <span className="text-[10px] sm:text-[12px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Thực thu</span>
                            <span className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white italic tracking-tighter leading-none">{(total/1000).toFixed(0)}k</span>
                        </div>
                    )}
                </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4 w-full px-2 sm:px-6">
                {data.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 sm:gap-4 overflow-hidden py-1">
                        <div className="w-3 h-3 sm:w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] sm:text-[12px] font-black uppercase text-zinc-600 dark:text-zinc-400 truncate leading-none italic tracking-tight">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Page Component ---

export default function DashboardPage() {
    const [summary, setSummary] = useState<any>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [tableRevenue, setTableRevenue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
            const [sRes, topRes, tableRes] = await Promise.all([
                apiClient(`/reports/summary?fromDate=${today}&toDate=${today}`),
                apiClient(`/reports/top-products?top=8&fromDate=${last30Days}&toDate=${today}`),
                apiClient(`/reports/revenue-by-table?fromDate=${last30Days}&toDate=${today}`)
            ]);

            const [s, t, tb] = await Promise.all([sRes.json(), topRes.json(), tableRes.json()]);

            if (s.status) setSummary(s.data);
            if (t.status) setTopProducts(t.data.map((x: any, i: number) => ({ label: x.name, value: x.quantity, color: ["#10b981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6", "#F43F5E"][i] })));
            if (tb.status) setTableRevenue(tb.data.map((x: any, i: number) => ({ label: x.tableName, value: x.totalRevenue, color: ["#10b981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1"][i % 6] })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
            <div className="flex flex-col items-center animate-pulse text-center">
                <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Command Center</p>
                <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1 px-4">Đang nạp dữ liệu thống kê...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-32 animate-in fade-in duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between px-4 gap-8 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-12 h-[2px] bg-zinc-900 dark:bg-white"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Intelligence Unit</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none">Trung tâm <br className="md:hidden"/><span className="text-emerald-500">Điều hành</span></h1>
                    <p className="text-sm font-bold text-zinc-400 italic mt-4">Theo dõi hiệu suất vận hành thời gian thực</p>
                </div>
                <button onClick={() => fetchData()} className="w-14 h-14 md:w-16 md:h-16 group relative bg-zinc-900 text-white rounded-[2rem] hover:bg-emerald-600 transition-all shadow-2xl hover:shadow-emerald-500/20 flex items-center justify-center active:scale-90 shrink-0">
                    <Zap className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-2">
                {[
                    { label: "Doanh thu ngày", val: summary?.totalRevenue || 0, icon: TrendingUp, color: "emerald", unit: "đ" },
                    { label: "Tổng đơn hàng", val: summary?.totalOrders || 0, icon: ShoppingBag, color: "blue", unit: " đơn" },
                    { label: "Tiền mặt", val: summary?.totalCash || 0, icon: Banknote, color: "rose", unit: "đ" },
                    { label: "Chuyển khoản", val: summary?.totalBank || 0, icon: CreditCard, color: "indigo", unit: "đ" },
                ].map((stat, i) => (
                    <div key={i} className="group bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all shadow-sm">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">{stat.label}</span>
                        </div>
                        <h4 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter tabular-nums leading-none mb-1">
                            {stat.val.toLocaleString()}
                            <span className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-30">{stat.unit}</span>
                        </h4>
                    </div>
                ))}
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-2">
                <ModernDonutChart data={tableRevenue} title="Top Doanh thu theo bàn" icon={Grid2X2} />
                <ModernDonutChart data={topProducts} title="Cơ cấu món bán chạy" icon={Trophy} showCenter={false} />
            </div>
        </div>
    );
}
