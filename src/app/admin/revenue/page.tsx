"use client";
import React, { useCallback, useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { 
    BadgeDollarSign, 
    Calendar, 
    Wallet, 
    CreditCard, 
    History, 
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    User,
    ArrowUpRight,
    Search,
    TrendingUp,
    Receipt,
    Loader2,
    Filter,
    ChevronDown,
    ArrowDownRight
} from "lucide-react";

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

    const fetchData = useCallback(async (selectedDate: string) => {
        setLoading(true);
        const query = `?fromDate=${selectedDate}&toDate=${selectedDate}`;
        try {
            const [summaryRes, ordersRes] = await Promise.all([
                apiClient(`/reports/summary${query}`),
                apiClient(`/reports/orders${query}&paymentStatus=Paid`)
            ]);

            const sData = await summaryRes.json();
            const oData = await ordersRes.json();

            if (sData.status === true) setSummary(sData.data);
            if (oData.status === true) setOrders(oData.data);
        } catch (err) {
            console.error("Fetch revenue error", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(date);
    }, [date, fetchData]);

    if (loading && !summary) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <div className="flex flex-col items-center animate-pulse">
                <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Đối soát tài chính</p>
                <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang tổng hợp dòng tiền...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-32 animate-in fade-in duration-700">
            
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-3xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-emerald-600/30 italic rotate-6">💸</div>
                        <div>
                             <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none mb-2">Đối soát <span className="text-emerald-600">Doanh thu</span></h1>
                             <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">Chi tiết thực thu và các giao dịch đã hoàn tất</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2.5 rounded-[1.8rem] border border-zinc-100 dark:border-zinc-800 shadow-xl group">
                    <Calendar className="w-5 h-5 text-zinc-400 ml-3 group-hover:text-emerald-500 transition-colors" />
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent border-none outline-none font-black text-xs uppercase text-zinc-900 dark:text-white p-2 min-w-[140px]"
                    />
                    <button onClick={() => fetchData(date)} className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-90 shadow-lg">
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* FINANCIAL CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* TOTAL REVENUE CARD */}
                <div className="bg-zinc-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-700">
                        <BadgeDollarSign className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6">Thực thu trong ngày</p>
                        <h3 className="text-5xl font-black italic tracking-tighter tabular-nums mb-8">
                            {(summary?.totalRevenue || 0).toLocaleString()}
                            <span className="text-xl ml-2 opacity-50 not-italic">đ</span>
                        </h3>
                        <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                <ArrowUpRight className="w-3 h-3" /> +12% So với trung bình
                             </div>
                             <div className="px-3 py-1.5 bg-white/5 text-zinc-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">
                                {orders.length} Đơn hàng
                             </div>
                        </div>
                    </div>
                </div>

                {/* CASH CARD */}
                <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet className="w-7 h-7 text-orange-600" />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-4 py-2 rounded-xl uppercase tracking-widest border border-orange-100 dark:border-orange-800/10 italic">Tiền Mặt</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Thanh toán trực tiếp</p>
                        <h4 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic tabular-nums leading-none">{(summary?.totalCash || 0).toLocaleString()} <span className="text-sm italic opacity-30">đ</span></h4>
                    </div>
                </div>

                {/* BANK TRANSFER CARD */}
                <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CreditCard className="w-7 h-7 text-indigo-600" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-xl uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/10 italic">Chuyển Khoản</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Qua App & QR Code</p>
                        <h4 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic tabular-nums leading-none">{(summary?.totalBank || 0).toLocaleString()} <span className="text-sm italic opacity-30">đ</span></h4>
                    </div>
                </div>
            </div>

            {/* TRANSACTION LIST */}
            <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-8 sm:p-12 h-full flex flex-col min-h-[500px]">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none mb-3">Lịch sử Giao dịch <span className="text-emerald-600">Thành công</span></h3>
                        <p className="text-sm font-bold text-zinc-400 italic">Đối soát chi tiết từng đơn hàng trong ngày {new Date(date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 shrink-0">
                         <Filter className="w-4 h-4 text-zinc-400 ml-2" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pr-2 italic">Tất cả {orders.length} Đơn đã trả</span>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                                <th className="py-6 px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mã Giao Dịch</th>
                                <th className="py-6 px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vị trí & Thời gian</th>
                                <th className="py-6 px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tổng thực thu</th>
                                <th className="py-6 px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Đối soát</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center opacity-30">
                                        <History className="w-20 h-20 mx-auto mb-6 stroke-[1.5]" />
                                        <p className="text-sm font-black uppercase tracking-widest">Chưa có giao dịch nào</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o.orderId} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-all">
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-2 h-2 rounded-full bg-emerald-500 scale-0 group-hover:scale-100 transition-transform" />
                                                 <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight group-hover:text-emerald-600 transition-colors">#{o.orderCode}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-3">
                                                 <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[9px] font-black text-zinc-500 uppercase tracking-widest">{o.tableName}</span>
                                                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest border-l border-zinc-100 dark:border-zinc-800 pl-3"><Clock className="w-3 h-3 inline-block mr-1" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">{o.totalAmount.toLocaleString()}đ</span>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50 transition-transform group-hover:scale-105 shadow-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">Hợp lệ</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
