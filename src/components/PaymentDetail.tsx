import React from "react";
import { apiClient } from "@/lib/apiClient";
import { X, Loader2, Banknote, CreditCard, CheckCircle2 } from "lucide-react";

export interface PaymentDetailProps {
  orderId: number;
  onClose: () => void;
}

interface OrderDetailItem {
  productId: number;
  name?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: number;
  orderCode: string;
  tableId: number;
  createdAt: string;
  totalAmount: number;
  orderDetails?: OrderDetailItem[];
}

export function PaymentDetail({ orderId, onClose }: PaymentDetailProps) {
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    apiClient(`/orders/${orderId}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === true || res.status === "success" || res.status === 200) {
          setOrder(res.data);
        } else {
          setError(res.message || "Failed to load order");
        }
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePayment = async (method: "Cash" | "Bank") => {
    setPaying(true);
    setError(null);
    try {
      const res = await apiClient(`/payments/process-manual`, {
        method: "POST",
        body: JSON.stringify({ orderId, paymentMethod: method }),
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(result.message || "Payment failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl p-8 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const total = order.orderDetails?.reduce((sum, d) => sum + d.price * d.quantity, 0) || order.totalAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Payment</h2>
            <p className="text-xs text-muted-foreground">Order #{order.orderCode}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Successful</h3>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          ) : (
            <>
              {/* Order Items */}
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {order.orderDetails?.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground">{d.name || `Product #${d.productId}`} x{d.quantity}</span>
                    <span className="text-muted-foreground">{(d.price * d.quantity).toLocaleString()}d</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-3 border-t border-border mb-4">
                <span className="font-medium">Total</span>
                <span className="text-xl font-semibold text-accent">{total.toLocaleString()}d</span>
              </div>

              {error && (
                <div className="text-sm text-destructive mb-4">{error}</div>
              )}

              {/* Payment Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button 
                  onClick={() => handlePayment("Cash")} 
                  disabled={paying}
                  className="flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Banknote className="w-4 h-4" /> Cash
                </button>
                <button 
                  onClick={() => handlePayment("Bank")} 
                  disabled={paying}
                  className="flex items-center justify-center gap-2 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" /> Transfer
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
