import React from "react";
import { API_BASE_URL, NGROK_HEADERS } from "@/app/api/apiConfig";
import { X, Loader2, Package } from "lucide-react";

export interface Order {
  id: number;
  orderCode: string;
  tableId: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  totalAmount: number;
  orderItems?: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    product?: {
      id: number;
      name: string;
      price: number;
      imageUrl?: string;
    };
  }>;
}

export interface OrderDetail {
  productId: number;
  quantity: number;
  price: number;
  name?: string;
}

export interface OrderDetailViewProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailView({ order, onClose }: OrderDetailViewProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full max-w-sm border border-border" style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-zinc-50 dark:bg-zinc-900/80">
          <div>
            <div className="font-bold text-base text-foreground">Đơn hàng #{order.orderCode}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
          <button onClick={onClose} className="text-foreground text-xl leading-none px-2 py-1 cursor-pointer">×</button>
        </div>
        <div className="px-6 py-4 bg-card">
          <div className="flex gap-2 mb-4">
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-border ${order.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'}`}>{order.status === 'Paid' ? 'Hoàn tất' : 'Chờ xử lý'}</span>
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-border ${order.paymentStatus === 'Paid' ? 'bg-accent/20 text-accent' : 'bg-destructive/10 text-destructive'}`}>{order.paymentStatus === 'Paid' ? 'Đã thu tiền' : 'Chưa thu'}</span>
          </div>
          <div className="space-y-2">
            <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-2">
              {order.orderItems && order.orderItems.length > 0 ? order.orderItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between border border-border px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-muted flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground uppercase tracking-tight">{item.product?.name || `Sản phẩm #${item.productId}`}</div>
                      <div className="text-[11px] text-muted-foreground font-medium">x{item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-foreground tabular-nums">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                </div>
              )) : <div className="text-center text-muted-foreground">Không có sản phẩm</div>}
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tổng cộng</span>
              <span className="text-lg font-black text-accent tabular-nums">{order.totalAmount.toLocaleString()}đ</span>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 pt-0">
          <button 
            onClick={onClose}
            className="w-full py-3 text-xs font-bold uppercase tracking-widest bg-muted text-foreground border border-border cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
