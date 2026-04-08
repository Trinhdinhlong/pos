"use client";
import React from "react";
import { Receipt, Table as TableIcon, Clock, User, Phone, MapPin } from "lucide-react";

interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    orderCode: string;
    tableName?: string;
    tableId: number;
    totalAmount: number;
    createdAt: string;
    orderItems: OrderItem[];
    paymentStatus: string;
}

interface PrintableInvoiceProps {
    order: Order;
}

export const PrintableInvoice = React.forwardRef<HTMLDivElement, PrintableInvoiceProps>(({ order }, ref) => {
    return (
        <div ref={ref} className="p-4 bg-white text-black font-mono text-sm w-[80mm] mx-auto print:block hidden">
            <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                <h2 className="text-xl font-bold uppercase">HỆ THỐNG POS</h2>
                <div className="flex items-center justify-center gap-1 mt-1 text-[10px]">
                    <MapPin className="w-2 h-2" />
                    <span>Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px]">
                    <Phone className="w-2 h-2" />
                    <span>0123 456 789</span>
                </div>
            </div>

            <div className="space-y-1 mb-4 border-b border-dashed border-black pb-4">
                <div className="flex justify-between">
                    <span className="font-bold">MÃ ĐƠN:</span>
                    <span>#{order.orderCode}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">BÀN:</span>
                    <span className="uppercase">{order.tableName || `BÀN ${order.tableId}`}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">GIỜ:</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between uppercase">
                    <span className="font-bold">TRẠNG THÁI:</span>
                    <span>{order.paymentStatus === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</span>
                </div>
            </div>

            <table className="w-full mb-4 text-[11px]">
                <thead>
                    <tr className="border-b border-black text-left">
                        <th className="py-1">MÓN</th>
                        <th className="py-1 text-center">SL</th>
                        <th className="py-1 text-right">GIÁ</th>
                        <th className="py-1 text-right">TỔNG</th>
                    </tr>
                </thead>
                <tbody>
                    {order.orderItems?.map((item, idx) => (
                        <tr key={idx} className="border-b border-zinc-100 italic">
                            <td className="py-2 pr-2">{item.productName || `Món #${idx+1}`}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right">{(item.price || 0).toLocaleString()}</td>
                            <td className="py-2 text-right font-bold">{(item.quantity * (item.price || 0)).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="space-y-2 border-t-2 border-double border-black pt-4">
                <div className="flex justify-between text-lg font-black">
                    <span>TỔNG TIỀN:</span>
                    <span>{(order.totalAmount || 0).toLocaleString()}đ</span>
                </div>
            </div>

            <div className="mt-8 text-center border-t border-dashed border-black pt-4 pb-10">
                <p className="text-[10px] font-bold">CẢM ƠN QUÝ KHÁCH</p>
                <p className="text-[8px] italic">Vui lòng kiểm tra lại hóa đơn trước khi rời đi.</p>
                <div className="mt-4 flex justify-center opacity-50 grayscale">
                    {/* Placeholder for QR Code if needed */}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
});

PrintableInvoice.displayName = "PrintableInvoice";
