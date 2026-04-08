"use client";
import React, { useState, useEffect, useCallback } from "react";
import { 
    BarChart3, 
    TrendingUp, 
    ShoppingBag, 
    Users, 
    Calendar, 
    ArrowUpRight, 
    ArrowDownRight,
    Filter,
    Download,
    Trophy,
    BadgeDollarSign,
    CreditCard,
    Wallet,
    Clock,
    ChevronRight,
    Search,
    Loader2,
    Zap,
    Layers,
    ArrowRight
} from "lucide-react";

interface Summary {
    totalOrders: number;
    totalRevenue: number;
    totalShifts: number;
    totalCash: number;
    totalBank: number;
}

interface TopProduct {
    productId: number;
    name: string;
    quantity: number;
}

interface RevenueItem {
    period: string;
    totalRevenue: number;
}

interface RecentOrder {
    orderId: number;
    orderCode: string;
    tableName: string;
    userName: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
}

type FilterType = "today" | "7days" | "month" | "year" | "custom";

export default function ReportsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<RevenueItem[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>("7days");
    
    // Date Range
    const [dateRange, setDateRange] = useState({
        from: "",
        to: ""
    });

    const fetchData = useCallback(async (filter: FilterType, customRange?: {from: string, to: string}) => {
        setLoading(true);
        let from = "";
        let to = new Date().toISOString().split('T')[0];

        if (filter === "today") {
            from = to;
        } else if (filter === "7days") {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            from = d.toISOString().split('T')[0];
        } else if (filter === "month") {
            const d = new Date();
            d.setDate(1);
            from = d.toISOString().split('T')[0];
        } else if (filter === "custom" && customRange) {
            from = customRange.from;
            to = customRange.to;
        }

        const queryStr = from ? `?fromDate=${from}&toDate=${to}` : "";
        const periodQuery = from ? `&fromDate=${from}&toDate=${to}` : "";

        try {
            const [summaryRes, topRes, trendRes, ordersRes] = await Promise.all([
                fetch(`/api/reports/summary${queryStr}`),
                fetch(`/api/reports/top-products?top=5${from ? `&fromDate=${from}&toDate=${to}` : ""}`),
                fetch(`/api/reports/revenue-trend?period=day${periodQuery}`),
                fetch(`/api/reports/orders${queryStr}`)
            ]);

            const [s, t, tr, o] = await Promise.all([
                summaryRes.json(), topRes.json(), trendRes.json(), ordersRes.json()
            ]);

            if (s.status) setSummary(s.data);
            if (t.status) setTopProducts(t.data);
            if (tr.status) setRevenueTrend(tr.data);
            if (o.status) {
                const orders = Array.isArray(o.data) ? o.data : (o.data?.items || []);
                setRecentOrders(orders.slice(0, 10));
            }
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(activeFilter);
    }, [activeFilter, fetchData]);

    const handleCustomFilter = () => {
        if (dateRange.from && dateRange.to) {
            setActiveFilter("custom");
            fetchData("custom", dateRange);
        }
    };

    if (loading && !summary) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-zinc-900 dark:text-white animate-spin" />
            <div className="flex flex-col items-center animate-pulse">
                <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase font-black uppercase">Business Analytics</p>
                <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1 px-4">Đang nạp dữ liệu thống kê chuyên sâu...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-32 animate-in fade-in duration-700">
            
            {/* HEADER & FILTERS */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg italic font-black text-xl rotate-3">R</div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Business Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none">Báo cáo <br className="sm:hidden" /><span className="text-emerald-500">Phân tích</span></h1>
                    <p className="text-sm font-bold text-zinc-400 italic">Dữ liệu kinh doanh và xu hướng thị trường thời gian thực</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-x-auto no-scrollbar">
                    {(["today", "7days", "month", "year"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeFilter === f 
                                ? "bg-zinc-900 text-white shadow-xl scale-105" 
                                : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            }`}
                        >
                            {f === "today" ? "Hôm nay" : f === "7days" ? "7 Ngày" : f === "month" ? "Tháng này" : "Năm nay"}
                        </button>
                    ))}
                    <div className="h-4 w-px bg-zinc-100 dark:bg-zinc-800 mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-2 px-2">
                        <input 
                            type="date" 
                            className="bg-transparent border-none outline-none font-black text-[10px] uppercase text-zinc-500 w-[110px]"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                        />
                        <span className="text-zinc-300 font-bold text-xs">→</span>
                        <input 
                            type="date" 
                            className="bg-transparent border-none outline-none font-black text-[10px] uppercase text-zinc-500 w-[110px]"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                        />
                        <button 
                            onClick={handleCustomFilter}
                            className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-900 hover:text-white transition-all active:scale-90 flex items-center justify-center shrink-0"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                <AnalyticCard 
                    title="Tổng Doanh Thu" 
                    value={`${(summary?.totalRevenue || 0).toLocaleString()}đ`} 
                    icon={BadgeDollarSign}
                    trend="+12%"
                    description="Thực thu từ tất cả các nguồn"
                    color="emerald"
                />
                <AnalyticCard 
                    title="Đơn Hoàn Tất" 
                    value={summary?.totalOrders || 0} 
                    icon={ShoppingBag}
                    trend="+5%"
                    description="Số lượng giao dịch thành công"
                    color="blue"
                />
                <AnalyticCard 
                    title="Giao Dịch Cash" 
                    value={`${(summary?.totalCash || 0).toLocaleString()}đ`} 
                    icon={Wallet}
                    trend="-2%"
                    description="Thanh toán trực tiếp tại quầy"
                    color="orange"
                />
                <AnalyticCard 
                    title="Giao Dịch Bank" 
                    value={`${(summary?.totalBank || 0).toLocaleString()}đ`} 
                    icon={CreditCard}
                    trend="+18%"
                    description="Tổng thu qua QR & Chuyển khoản"
                    color="indigo"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 px-2 lg:px-4">
                {/* REVENUE TREND CHART */}
                <div className="xl:col-span-2 bg-white dark:bg-zinc-900 p-10 sm:p-14 rounded-[4rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                        <BarChart3 className="w-80 h-80 text-zinc-900 dark:text-white" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div>
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter italic leading-none">
                                <TrendingUp className="w-8 h-8 text-emerald-500" />
                                Biến động Kinh doanh
                            </h3>
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Sơ đồ tổng doanh thu tự động</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700/50">
                             <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Revenue Flow</span>
                        </div>
                    </div>
                    
                    <div className="h-[450px] flex items-end gap-3 sm:gap-8 relative z-10 pb-12 border-b border-zinc-50 dark:border-zinc-800/50">
                        {revenueTrend.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-4">
                                <Zap className="w-16 h-16 stroke-[1]" />
                                <p className="font-black uppercase text-[10px] tracking-[0.4em] italic leading-none">Chưa nạp được dữ liệu biến động</p>
                            </div>
                        ) : (
                            revenueTrend.map((item, idx) => {
                                const maxVal = Math.max(...revenueTrend.map(r => r.totalRevenue), 1);
                                const height = (item.totalRevenue / maxVal) * 100;
                                return (
                                    <div key={idx} className="flex-1 group/bar relative flex flex-col items-center justify-end h-full">
                                        <div className="absolute -top-14 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 pointer-events-none shadow-2xl z-20">
                                            {item.totalRevenue.toLocaleString()}đ
                                        </div>
                                        <div 
                                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-[1.5rem] transition-all duration-1000 ease-out group-hover/bar:bg-emerald-600 relative overflow-hidden group-hover/bar:shadow-2xl group-hover/bar:shadow-emerald-500/20"
                                            style={{ height: `${height}%` }}
                                        >
                                             <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="absolute -bottom-10 transform -rotate-45 sm:rotate-0 whitespace-nowrap">
                                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{item.period.split('-').slice(-2).join('/')}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* BEST SELLERS SIDEBAR */}
                <div className="bg-zinc-950 text-white p-10 sm:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <h3 className="text-3xl font-black italic flex items-center gap-3 uppercase tracking-tighter leading-[0.9]">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                            Best <br/><span className="text-emerald-500">Sellers</span>
                        </h3>
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner">
                            <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
                        </div>
                    </div>
                    
                    <div className="space-y-5 relative z-10 flex-1 no-scrollbar overflow-y-auto pr-2">
                        {topProducts.map((product, idx) => (
                            <div key={idx} className="group flex items-center gap-5 p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 transition-all cursor-default hover:translate-x-2">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black italic shrink-0 ${
                                    idx === 0 ? 'bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20' : 
                                    idx === 1 ? 'bg-zinc-300 text-zinc-900' : 
                                    'bg-zinc-800 text-zinc-500'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-black uppercase tracking-tight truncate mb-2">{product.name}</span>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${(product.quantity / (topProducts[0]?.quantity || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="block text-xl font-black italic tabular-nums">{product.quantity}</span>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest opacity-60">Items</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button className="relative w-full mt-10 py-6 bg-white text-zinc-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-600 hover:text-white transition-all active:scale-95 group flex items-center justify-center gap-3 shadow-2xl">
                        Xem tất cả món ăn <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* RECENT TRANSACTIONS TABLE */}
            <div className="bg-white dark:bg-zinc-900 rounded-[4rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-10 sm:p-14">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter italic leading-none mb-3">
                            <Clock className="w-8 h-8 text-indigo-500" />
                            Giao dịch <span className="text-indigo-500">Gần nhất</span>
                        </h3>
                        <p className="text-zinc-400 text-sm font-bold italic">Top 10 giao dịch cuối cùng được hệ thống ghi nhận</p>
                    </div>
                    <button className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white transition-all shadow-2xl active:scale-90">
                        <Download className="w-4 h-4" /> Xuất tập tin báo cáo (.CSV)
                    </button>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                            <tr className="text-zinc-400">
                                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest">ID Đơn</th>
                                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest">Vị trí</th>
                                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest">Phụ trách</th>
                                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-right">Thành tiền</th>
                                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-center">Trạng thái</th>
                                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {recentOrders.map((o) => (
                                <tr key={o.orderId} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                                    <td className="py-7 px-4">
                                        <div className="flex items-center gap-3">
                                             <div className="w-2 h-2 rounded-full bg-indigo-500 scale-0 group-hover:scale-100 transition-transform"></div>
                                             <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">#{o.orderCode}</span>
                                        </div>
                                    </td>
                                    <td className="py-7 px-4">
                                        <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-500 tracking-widest">{o.tableName}</span>
                                    </td>
                                    <td className="py-7 px-4">
                                        <div className="flex items-center gap-2">
                                             <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-zinc-400">{o.userName?.charAt(0) || 'S'}</div>
                                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight">{o.userName || 'STAFF'}</span>
                                        </div>
                                    </td>
                                    <td className="py-7 px-4 text-right">
                                        <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">{o.totalAmount.toLocaleString()}đ</span>
                                    </td>
                                    <td className="py-7 px-4 text-center">
                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            o.paymentStatus === 'Paid' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                        }`}>
                                            {o.paymentStatus === 'Paid' ? 'Complete' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="py-7 px-4 text-right">
                                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AnalyticCard({ title, value, icon: Icon, trend, description, color }: any) {
    const colorMap: any = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    return (
        <div className="group bg-white dark:bg-zinc-900 p-10 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Icon className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className={`p-5 rounded-[1.8rem] ${colorMap[color]} transition-transform group-hover:rotate-12`}>
                    <Icon className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5" /> {trend}
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.4em] mb-3">{title}</p>
                <div className="flex items-end gap-2 mb-2">
                    <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none italic tabular-nums">{value}</h4>
                </div>
                <p className="text-zinc-300 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wide leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
