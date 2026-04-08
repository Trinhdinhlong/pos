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
            <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-2xl min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <div className="flex flex-col items-center animate-pulse">
                    <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Bảng Điều Khiển</p>
                    <p className="text-zinc-400 text-xs font-medium mt-1">Đang tải dữ liệu...</p>
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Bảng Điều Khiển</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Tổng quan hoạt động kinh doanh</p>
                </div>
                <button 
                    onClick={() => fetchData(true)} 
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all active:scale-95 text-sm cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "Cập nhật..." : "Làm mới"}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${stat.positive ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'}`}>
                                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(stat.change)}%
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                                {formatValue(stat.value, stat.format)}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-6 flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Sản phẩm bán chạy</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">30 ngày gần nhất</p>
                        </div>
                    </div>
                    
                    {topProducts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <ShoppingBag className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
                            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((item, i) => {
                                const maxValue = Math.max(...topProducts.map(p => p.value));
                                const percentage = (item.value / maxValue) * 100;
                                return (
                                    <div key={i} className="space-y-2 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1 mr-3">{item.label}</span>
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums whitespace-nowrap">{item.value}</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-700"
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
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-6 flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Doanh thu theo bàn</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">30 ngày gần nhất</p>
                        </div>
                    </div>

                    {tableRevenue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <TrendingUp className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
                            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tableRevenue.map((item, i) => {
                                const maxValue = Math.max(...tableRevenue.map(p => p.value));
                                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                return (
                                    <div key={i} className="space-y-2 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1 mr-3">{item.label}</span>
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums whitespace-nowrap">
                                                {new Intl.NumberFormat('vi-VN').format(item.value)}đ
                                            </span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-700"
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
