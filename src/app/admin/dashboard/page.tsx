"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
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
                apiClient(`/reports/summary?fromDate=${today}&toDate=${today}`),
                apiClient(`/reports/top-products?top=6&fromDate=${last30Days}&toDate=${today}`),
                apiClient(`/reports/revenue-by-table?fromDate=${last30Days}&toDate=${today}`)
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        { 
            label: "Today Revenue", 
            value: summary?.totalRevenue || 0, 
            icon: TrendingUp, 
            format: "currency",
            change: 12.5,
            positive: true
        },
        { 
            label: "Total Orders", 
            value: summary?.totalOrders || 0, 
            icon: ShoppingBag, 
            format: "number",
            change: 8.2,
            positive: true
        },
        { 
            label: "Cash", 
            value: summary?.totalCash || 0, 
            icon: Banknote, 
            format: "currency",
            change: -2.4,
            positive: false
        },
        { 
            label: "Bank Transfer", 
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time overview of your business</p>
                </div>
                <button 
                    onClick={() => fetchData(true)} 
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-muted rounded-lg">
                                <stat.icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-success' : 'text-destructive'}`}>
                                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(stat.change)}%
                            </div>
                        </div>
                        <p className="text-2xl font-semibold text-foreground tabular-nums">
                            {formatValue(stat.value, stat.format)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-muted rounded-lg">
                            <Trophy className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground">Top Products</h3>
                            <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </div>
                    </div>
                    
                    {topProducts.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                            No data available
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((item, i) => {
                                const maxValue = Math.max(...topProducts.map(p => p.value));
                                const percentage = (item.value / maxValue) * 100;
                                return (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground truncate flex-1 mr-4">{item.label}</span>
                                            <span className="text-muted-foreground font-medium tabular-nums">{item.value}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500"
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
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-muted rounded-lg">
                            <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground">Revenue by Table</h3>
                            <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </div>
                    </div>

                    {tableRevenue.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                            No data available
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tableRevenue.map((item, i) => {
                                const maxValue = Math.max(...tableRevenue.map(p => p.value));
                                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                return (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground">{item.label}</span>
                                            <span className="text-muted-foreground font-medium tabular-nums">
                                                {new Intl.NumberFormat('vi-VN').format(item.value)}d
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500"
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
