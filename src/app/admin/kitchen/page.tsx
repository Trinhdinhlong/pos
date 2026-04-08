"use client";
import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { SIGNALR_URL } from "@/app/api/apiConfig";
import * as signalR from "@microsoft/signalr";
import { ChefHat, Clipboard, Clock, CheckCircle2, AlertCircle, Loader2, Zap, Flame, UtensilsCrossed, ArrowRight, Activity, TrendingUp, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    orderCode: string;
    tableId: number;
    tableName?: string;
    status: string;
    createdAt: string;
    orderItems: OrderItem[];
    totalAmount: number;
}

export default function KitchenDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await apiClient("/orders?status=Pending");
            const result = await res.json();
            if (result.status === true || result.status === "success" || result.status === 200) {
                const pending = result.data.filter((o: any) => o.status === "Pending").reverse();
                setOrders(pending);
            }
        } catch (err) {
            console.error("Kitchen fetch error", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALR_URL)
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                setConnected(true);
                console.log("SignalR Connected to Kitchen Hub");
            })
            .catch(err => console.error("SignalR Hub Error: ", err));

        connection.on("NewOrder", (newOrder: Order) => {
            setOrders(prev => [...prev, newOrder]);
            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => {});
        });

        return () => { connection.stop(); };
    }, [fetchOrders]);

    const handleComplete = async (orderId: number) => {
        try {
            const res = await apiClient(`/orders/${orderId}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: "Paid" })
            });
            if (res.ok) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
            }
        } catch (err) {
            console.error("Kitchen stage update error", err);
        }
    };

    const getTimeElapsed = (createdAt: string) => {
        const start = new Date(createdAt);
        const now = new Date();
        return Math.floor((now.getTime() - start.getTime()) / 60000);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4 bg-background rounded-[3rem] min-h-[70vh] border-2 border-dashed border-zinc-100 dark:border-zinc-800">
            <div className="relative">
                <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                <div className="absolute inset-0 bg-orange-500/20 blur-2xl animate-pulse rounded-full" />
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
                <p className="text-zinc-900 dark:text-zinc-100 font-black text-2xl italic uppercase tracking-tighter">Kitchen Base</p>
                <p className="text-zinc-400 text-[10px] font-black tracking-[0.4em] uppercase">Đang đồng bộ hóa dữ liệu thời gian thực...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen space-y-12 pb-32 animate-in fade-in duration-700">
            
            {/* HEADER SECTION */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 px-2 pt-10">
                <div className="space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 italic font-black text-2xl rotate-3">K</div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 block">System Protocol</span>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Live Station</span>
                        </div>
                    </motion.div>
                    <h1 className="text-7xl font-black text-zinc-900 dark:text-white tracking-widest uppercase italic leading-none">
                       NHÀ <span className="text-orange-500 underline decoration-8 decoration-orange-500/20">BẾP</span>
                    </h1>
                    <p className="text-sm font-bold text-zinc-400 italic max-w-lg leading-relaxed">
                        Điều phối danh sách món ăn thời gian thực. Tối ưu hóa tốc độ phục vụ với độ trễ cực thấp.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="bg-white dark:bg-zinc-900 px-8 py-5 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Queue</p>
                            <p className="text-3xl font-black italic text-zinc-900 dark:text-white tabular-nums">{orders.length}</p>
                        </div>
                        <div className="w-px h-10 bg-zinc-100 dark:bg-zinc-800" />
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Uptime</p>
                            <p className="text-3xl font-black italic text-emerald-500 tabular-nums">99.9</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-4 px-8 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${connected ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white animate-pulse'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white opacity-40 ${connected ? 'animate-pulse' : ''}`} />
                        {connected ? 'STATION LIVE' : 'DISCONNECTED'}
                    </div>
                </div>
            </div>

            {/* MAIN GRID */}
            <AnimatePresence mode="popLayout">
                {orders.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center py-48 bg-white dark:bg-zinc-900/50 rounded-[5rem] border-4 border-dashed border-zinc-100 dark:border-zinc-800/50"
                    >
                        <div className="relative mb-10">
                            <UtensilsCrossed className="w-32 h-32 text-zinc-200 dark:text-zinc-800 stroke-[1]" />
                            <CheckCircle2 className="absolute -bottom-2 -right-2 w-12 h-12 text-emerald-500 stroke-[3]" />
                        </div>
                        <h3 className="text-3xl font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.6em] italic leading-none">CLEARED</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-300 dark:text-zinc-700 tracking-[0.4em] mt-6">Hệ thống đã xử lý xong mọi đơn hàng</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 px-2">
                        {orders.map((order, idx) => {
                            const waitTime = getTimeElapsed(order.createdAt);
                            const isUrgent = waitTime > 15;

                            return (
                                <motion.div
                                    layout
                                    key={order.id}
                                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                >
                                    <Card className={`group relative overflow-hidden h-full flex flex-col border-2 ${isUrgent ? 'border-rose-500/30 bg-rose-500/[0.02]' : 'border-zinc-50 dark:border-zinc-800'}`}>
                                        
                                        {/* HEADER */}
                                        <div className={`p-8 pb-6 flex items-center justify-between border-b ${isUrgent ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800'}`}>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                     <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">BÀN {order.tableId}</h2>
                                                     {isUrgent && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                                                </div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{order.orderCode}</p>
                                            </div>
                                            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-3xl shadow-lg ${isUrgent ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-zinc-900 dark:bg-zinc-800 text-white'}`}>
                                                <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">WAIT</span>
                                                <span className="text-2xl font-black italic tabular-nums leading-none">{waitTime}</span>
                                                <span className="text-[8px] font-black uppercase">MIN</span>
                                            </div>
                                        </div>

                                        {/* CONTENT */}
                                        <CardContent className="p-8 flex-grow space-y-8">
                                            {order.orderItems?.map((item) => (
                                                <div key={item.id} className="flex items-start gap-5 group/item">
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-lg shrink-0 group-hover/item:rotate-12 transition-transform shadow-lg shadow-orange-500/20">
                                                        {item.quantity}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight leading-tight text-lg">
                                                            {item.productName || `Món #${item.productId}`}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black uppercase text-zinc-400 tracking-widest">Main Course</div>
                                                            <div className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black uppercase text-zinc-400 tracking-widest">Standard</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>

                                        {/* FOOTER ACTION */}
                                        <div className="p-8 pt-0">
                                            <Button 
                                                variant="premium"
                                                size="lg"
                                                onClick={() => handleComplete(order.id)}
                                                className={`w-full h-16 group ${isUrgent ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
                                            >
                                                HOÀN TẤT CHẾ BIẾN
                                                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                                            </Button>
                                        </div>

                                        {/* DECORATIVE ELEMENTS */}
                                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                            <Layers className="w-16 h-16" />
                                        </div>
                                        {isUrgent && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />}
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
