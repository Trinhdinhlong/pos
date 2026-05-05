"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
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
    const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Lấy token từ cookie
    function getTokenFromCookie() {
        if (typeof document === "undefined") return null;
        const match = document.cookie.match(/(^| )token=([^;]+)/);
        return match ? match[2] : null;
    }

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
            const token = getTokenFromCookie();
            const API_BASE = "http://localhost:5298/api/reports";
            const fetchWithAuth = (url: string) =>
                token
                    ? fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                    : fetch(url);

            const now = new Date();
            const year = now.getFullYear();
            const fromYear = `${year}-01-01`;
            const toYear = `${year}-12-31`;

            const [sRes, topRes, tableRes, monthRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/summary?fromDate=${today}&toDate=${today}`),
                fetchWithAuth(`${API_BASE}/top-products?top=6&fromDate=${last30Days}&toDate=${today}`),
                fetchWithAuth(`${API_BASE}/revenue-by-table?fromDate=${last30Days}&toDate=${today}`),
                fetchWithAuth(`${API_BASE}/revenue-by-period?period=Month&fromDate=${fromYear}&toDate=${toYear}`)
            ]);

            const [s, t, tb, m] = await Promise.all([sRes.json(), topRes.json(), tableRes.json(), monthRes.json()]);

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
            // Xử lý dữ liệu doanh thu tháng
            if (m.status && Array.isArray(m.data)) {
                type MonthRevenue = { period: string; totalRevenue: number };
                const arr = Array(12).fill(0);
                (m.data as MonthRevenue[]).forEach((item) => {
                    if (item.period && item.totalRevenue !== undefined) {
                        const parts = item.period.split('-');
                        if (parts.length >= 2) {
                            const month = parseInt(parts[1], 10);
                            if (month >= 1 && month <= 12) {
                                arr[month - 1] = item.totalRevenue;
                            }
                        }
                    }
                });
                setMonthlyRevenue(arr);
            }
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
            <div className="flex flex-col items-center justify-center p-24 gap-4 bg-card rounded-xl min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="flex flex-col items-center animate-pulse">
                    <p className="text-foreground font-medium text-base">Bảng Điều Khiển</p>
                    <p className="text-muted-foreground text-xs mt-1">Đang tải dữ liệu...</p>
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Bảng Điều Khiển</h1>
                    <p className="text-sm text-muted-foreground">Tổng quan hoạt động kinh doanh</p>
                </div>
                <button 
                    onClick={() => fetchData(true)} 
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all active:scale-95 text-sm cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "Cập nhật..." : "Làm mới"}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-card p-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(stat.change)}%
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
                            <h3 className="text-xl font-semibold text-foreground tabular-nums">
                                {formatValue(stat.value, stat.format)}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Products */}
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden p-5 flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Sản phẩm bán chạy</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">30 ngày gần nhất</p>
                        </div>
                    </div>
                    
                    {topProducts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((item, i) => {
                                const maxValue = Math.max(...topProducts.map(p => p.value));
                                const percentage = (item.value / maxValue) * 100;
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">{item.label}</span>
                                            <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{item.value}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden p-5 flex flex-col min-h-[400px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Doanh thu theo bàn</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">30 ngày gần nhất</p>
                        </div>
                    </div>

                    {tableRevenue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tableRevenue.map((item, i) => {
                                const maxValue = Math.max(...tableRevenue.map(p => p.value));
                                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">{item.label}</span>
                                            <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                                                {new Intl.NumberFormat('vi-VN').format(item.value)}đ
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
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

            {/* Revenue by Month Chart - moved to bottom */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                <h3 className="text-base font-semibold text-foreground mb-4">Doanh thu năm {new Date().getFullYear()} theo tháng</h3>
                <Bar
                    data={{
                        labels: [
                            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
                        ],
                        datasets: [
                            {
                                label: 'Doanh thu (VNĐ)',
                                data: monthlyRevenue,
                                backgroundColor: '#3b82f6',
                            },
                        ],
                    }}
                    options={{
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            title: { display: false },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value: string | number) {
                                        return Number(value).toLocaleString('vi-VN') + 'đ';
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}
