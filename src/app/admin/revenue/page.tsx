"use client";
import React, { useCallback, useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/api/apiConfig";
import { 
    BadgeDollarSign, 
    Calendar, 
    Wallet, 
    CreditCard, 
    History, 
    CheckCircle2,
    Search,
    Loader2
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface RevenueSummary {
    totalRevenue: number;
    totalOrders: number;
    totalCash: number;
    totalBank: number;
}

interface OrderReport {
    orderId: number;
    orderCode: string;
    tableName: string;
    userName: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
}

export default function RevenuePage() {
    const [summary, setSummary] = useState<RevenueSummary | null>(null);
    const [orders, setOrders] = useState<OrderReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 5;

    const fetchData = useCallback(async (selectedDate: string, page: number) => {
        setLoading(true);
        const query = `?fromDate=${selectedDate}&toDate=${selectedDate}&pageNumber=${page}&pageSize=${pageSize}`;
        // Lấy token từ cookie
        function getTokenFromCookie() {
            if (typeof document === "undefined") return null;
            const match = document.cookie.match(/(^| )token=([^;]+)/);
            return match ? match[2] : null;
        }
        const token = getTokenFromCookie();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // Đổi sang gọi trực tiếp API backend ASP.NET
        const API_BASE = "http://localhost:5298/api/reports";
        try {
            const [summaryRes, ordersRes] = await Promise.all([
                fetch(`${API_BASE}/summary?fromDate=${selectedDate}&toDate=${selectedDate}`, { headers }),
                fetch(`${API_BASE}/orders${query}&paymentStatus=Paid`, { headers })
            ]);

            const sData = await summaryRes.json();
            const oData = await ordersRes.json();

            if (sData.status === true) setSummary(sData.data);
            if (oData.status === true) {
                const allItems = Array.isArray(oData.data) ? oData.data : (oData.data?.items || []);
                const isBackendPaginated = oData.data?.items !== undefined;

                if (isBackendPaginated) {
                    setOrders(allItems);
                    setTotalPages(oData.data?.totalPages || 1);
                    setTotalCount(oData.data?.totalCount || allItems.length);
                } else {
                    // Manual frontend pagination if backend doesn't support it
                    const sliceStart = (page - 1) * pageSize;
                    const sliceEnd = sliceStart + pageSize;
                    setOrders(allItems.slice(sliceStart, sliceEnd));
                    setTotalPages(Math.ceil(allItems.length / pageSize) || 1);
                    setTotalCount(allItems.length);
                }
            }
        } catch (err) {
            console.error("Fetch revenue error", err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchData(date, currentPage);
    }, [date, currentPage, fetchData]);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        setCurrentPage(1);
    };

    if (loading && !summary) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-2xl min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <div className="flex flex-col items-center animate-pulse">
                <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Doanh Thu</p>
                <p className="text-zinc-400 text-xs font-medium mt-1">Đang tải dữ liệu...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-8">
            
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Doanh Thu</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Theo dõi và đối soát doanh thu từng ngày</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800 group cursor-pointer">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white p-1 min-w-[120px] cursor-pointer"
                    />
                    <button onClick={() => fetchData(date, currentPage)} className="w-7 h-7 bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700 transition-colors cursor-pointer">
                        <Search className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* FINANCIAL CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-sm relative overflow-hidden cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-medium opacity-90 mb-2">Doanh thu hôm nay</p>
                            <h3 className="text-2xl font-bold tabular-nums">
                                {(summary?.totalRevenue || 0).toLocaleString()}đ
                            </h3>
                        </div>
                        <BadgeDollarSign className="w-5 h-5 opacity-70" />
                    </div>
                    <p className="text-xs opacity-80">{summary?.totalOrders || 0} đơn hoàn tất</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Tiền mặt</p>
                            <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                                {(summary?.totalCash || 0).toLocaleString()}đ
                            </h4>
                        </div>
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/30 rounded-lg flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Chuyển khoản</p>
                            <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                                {(summary?.totalBank || 0).toLocaleString()}đ
                            </h4>
                        </div>
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* TRANSACTION LIST */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden h-full flex flex-col min-h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Lịch sử giao dịch</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">Ngày {new Date(date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {totalCount} giao dịch
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar flex-1">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                <th className="py-3 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Đơn hàng</th>
                                <th className="py-3 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Bàn & Giờ</th>
                                <th className="py-3 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Tổng</th>
                                <th className="py-3 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-zinc-400">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">Không có giao dịch</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o.orderId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">#{o.orderCode}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                 <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-medium text-zinc-600 dark:text-zinc-400">{o.tableName}</span>
                                                 <span className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">{o.totalAmount.toLocaleString()}đ</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>Hợp lệ</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
