"use client";
import React, { useEffect, useState, useCallback } from "react";
import { 
    TrendingUp, 
    ShoppingBag, 
    Trophy,
    CreditCard,
    Banknote,
    RefreshCw,
    Loader2,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

interface Summary {
  totalRevenue: number;
  totalOrders: number;
  totalCash: number;
  totalBank: number;
}

interface ChartItem {
  label: string;
  value: number;
  color: string;
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e", "#84cc16"];

export default function DashboardPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [topProducts, setTopProducts] = useState<ChartItem[]>([]);
    const [tableRevenue, setTableRevenue] = useState<ChartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
            const [sRes, topRes, tableRes] = await Promise.all([
                fetch(`/api/reports/summary?fromDate=${today}&toDate=${today}`),
                fetch(`/api/reports/top-products?top=6&fromDate=${last30Days}&toDate=${today}`),
                fetch(`/api/reports/revenue-by-table?fromDate=${last30Days}&toDate=${today}`)
            ]);

            const [s, t, tb] = await Promise.all([sRes.json(), topRes.json(), tableRes.json()]);

            if (s.status) setSummary(s.data);
            if (t.status) setTopProducts(t.data.map((x: { name: string; quantity: number }, i: number) => ({ 
                label: x.name, 
                value: x.quantity, 
                color: CHART_COLORS[i % CHART_COLORS.length] 
            })));
            if (tb.status) setTableRevenue(tb.data.slice(0, 6).map((x: { tableName: string; totalRevenue: number }, i: number) => ({ 
                label: x.tableName, 
                value: x.totalRevenue, 
                color: CHART_COLORS[i % CHART_COLORS.length] 
            })));
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <div className="flex flex-col items-center animate-pulse">
                    <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ điều hành POS</p>
                    <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang phân tích dữ liệu...</p>
                </div>
            </div>
        );
    }

    const stats = [
        { 
            label: "Doanh thu hôm nay", 
            value: summary?.totalRevenue || 0, 
            icon: TrendingUp, 
            format: "currency",
            change: 12.5,
            positive: true
        },
        { 
            label: "Số lượng đơn hàng", 
            value: summary?.totalOrders || 0, 
            icon: ShoppingBag, 
            format: "number",
            change: 8.2,
            positive: true
        },
        { 
            label: "Tiền mặt", 
            value: summary?.totalCash || 0, 
            icon: Banknote, 
            format: "currency",
            change: -2.4,
            positive: false
        },
        { 
            label: "Chuyển khoản", 
            value: summary?.totalBank || 0, 
            icon: CreditCard, 
            format: "currency",
            change: 18.7,
            positive: true
        },
    ];

    const formatValue = (value: number, format: string) => {
        if (format === "currency") {
            return new Intl.NumberFormat('vi-VN').format(value) + "d";
        }
        return value.toString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-10">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/30 italic rotate-6">📊</div>
                        <div>
                             <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none mb-2">Bảng <span className="text-indigo-600">Điều khiển</span></h1>
                             <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">Tổng quan hoạt động kinh doanh thời gian thực</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => fetchData(true)} 
                    disabled={refreshing}
                    className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-zinc-950/10 active:scale-95 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "ĐANG CẬP NHẬT" : "LÀM MỚI DỮ LIỆU"}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group cursor-pointer hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <stat.icon className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stat.positive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-100'}`}>
                                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(stat.change)}%
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">{stat.label}</p>
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic tabular-nums leading-none">
                                {formatValue(stat.value, stat.format)}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-10 flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Sản phẩm bán chạy</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Tính trong 30 ngày gần nhất</p>
                        </div>
                    </div>
                    
                    {topProducts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20">
                            <ShoppingBag className="w-16 h-16 mb-4 stroke-[1.5]" />
                            <p className="text-xs font-black uppercase tracking-widest">Chưa có dữ liệu thống kê</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {topProducts.map((item, i) => {
                                const maxValue = Math.max(...topProducts.map(p => p.value));
                                const percentage = (item.value / maxValue) * 100;
                                return (
                                    <div key={i} className="space-y-3 group cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight truncate flex-1 mr-4">{item.label}</span>
                                            <span className="text-[10px] font-black text-zinc-900 dark:text-white italic tabular-nums">{item.value} <span className="not-italic text-zinc-400">sp</span></span>
                                        </div>
                                        <div className="h-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-700 shadow-sm"
                                                style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Revenue by Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-10 flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Doanh thu theo bàn</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Đối soát dòng tiền 30 ngày qua</p>
                        </div>
                    </div>

                    {tableRevenue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20">
                            <TrendingUp className="w-16 h-16 mb-4 stroke-[1.5]" />
                            <p className="text-xs font-black uppercase tracking-widest">Chưa có dữ liệu doanh thu</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tableRevenue.map((item, i) => {
                                const maxValue = Math.max(...tableRevenue.map(p => p.value));
                                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                return (
                                    <div key={i} className="space-y-3 group cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">{item.label}</span>
                                            <span className="text-[10px] font-black text-zinc-900 dark:text-white italic tabular-nums">
                                                {new Intl.NumberFormat('vi-VN').format(item.value)}đ
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-700 shadow-sm"
                                                style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
