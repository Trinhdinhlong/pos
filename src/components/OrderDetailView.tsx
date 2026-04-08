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
  const [details, setDetails] = React.useState<OrderDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!order) return;
    setLoading(true);
    fetch(`/api/order?id=${order.id}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === true || res.status === "success" || res.status === 200) {
          setDetails(res.data.orderDetails || []);
        } else {
          setError(res.message || "Failed to load order details");
        }
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Order #{order.orderCode}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Status badges */}
          <div className="flex gap-2 mb-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              order.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'
            }`}>
              {order.status === 'Paid' ? 'Completed' : 'Processing'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              order.paymentStatus === 'Paid' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive py-4">{error}</div>
          ) : (
            <div className="space-y-3">
              {details.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.name || `Product #${d.productId}`}</p>
                      <p className="text-xs text-muted-foreground">x{d.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{(d.price * d.quantity).toLocaleString()}d</p>
                </div>
              ))}

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-lg font-semibold text-accent">{order.totalAmount.toLocaleString()}d</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button 
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
