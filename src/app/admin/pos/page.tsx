"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { API_BASE_URL, SIGNALR_URL, SEPAY_CONFIG, IMAGE_BASE_URL } from "@/app/api/apiConfig";
import * as signalR from "@microsoft/signalr";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Package,
  CreditCard, 
  Banknote,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
  ArrowRight
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
}

interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

interface Table {
  id: number;
  name: string;
  status: string;
}

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Transfer">("Cash");
  const [tempOrderId, setTempOrderId] = useState("");
  const [tempId, setTempId] = useState<number>(0);
  const [orderResult, setOrderResult] = useState<Record<string, unknown> | null>(null);

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "success">("idle");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, tRes] = await Promise.all([
          fetch(`/api/product`).then(r => r.json()),
          fetch(`/api/category`).then(r => r.json()),
          fetch(`/api/table`).then(r => r.json())
        ]);

        if (pRes.status) {
          const productData = pRes.data;
          setProducts(Array.isArray(productData) ? productData : (productData?.items || []));
        }
        if (cRes.status) {
          const categoryData = cRes.data;
          const sortedCats = Array.isArray(categoryData) 
            ? [...categoryData].sort((a: Category, b: Category) => a.displayOrder - b.displayOrder)
            : [];
          setCategories(sortedCats);
        }
        if (tRes.status) {
          const allTables = tRes.data as Table[];
          setTables(allTables);
          const takeAway = allTables.find(t => t.name?.includes("Mang ve") || t.name?.includes("Mang về"));
          if (takeAway) setSelectedTableId(takeAway.id);
        }
      } catch (err) {
        console.error("POS Data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
    return () => { if(newConnection) newConnection.stop(); };
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on("PaymentReceived", (data: any) => {
            if (data.status === "Success") setPaymentStatus("success");
          });
        })
        .catch(e => console.log("SignalR Connection failed: ", e));
    }
  }, [connection]);

  const total = useMemo(() => cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cartItems]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  useEffect(() => {
    if (showCheckout) {
      if (!tempOrderId) {
        const numericId = Math.floor(Math.random() * 900000000) + 100000000;
        const orderCode = `ORDER${numericId}`;
        setTempId(numericId);
        setTempOrderId(orderCode);
      }
      if (paymentMethod === "Transfer" && connection?.state === signalR.HubConnectionState.Connected) {
        connection.invoke("JoinOrderChannel", tempOrderId || "").catch(err => console.error(err));
      } else {
        setPaymentStatus("idle");
      }
    } else {
      setTempOrderId(""); 
      setTempId(0); 
      setPaymentStatus("idle");
    }
  }, [showCheckout, paymentMethod, connection, tempOrderId]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.productId === productId) {
        const nextQty = i.quantity + delta;
        return nextQty > 0 ? { ...i, quantity: nextQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const executeCheckout = useCallback(async (isPaid: boolean) => {
    if (cartItems.length === 0 || !tempId) return;
    setSubmitting(true);
    try {
      const selectedTable = tables.find(t => t.id === selectedTableId);
      const payload = {
        order: {
          id: tempId, 
          orderCode: tempOrderId, 
          tableId: Number(selectedTableId),
          paymentMethod, 
          orderType: selectedTable?.name?.includes("Mang") ? "TakeAway" : "Counter",
          totalAmount: total, 
          paymentStatus: isPaid ? "Paid" : "Pending"
        },
        items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.product.price }))
      };
      const res = await fetch(`/api/order?action=counter`, { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (data.status) {
        setOrderResult(data.data);
        setCartItems([]);
        setTimeout(() => window.location.reload(), 2000);
      } else alert(data.message || "Order failed");
    } catch { 
      alert("Connection error"); 
    } finally { 
      setSubmitting(false); 
    }
  }, [cartItems, selectedTableId, tempId, tempOrderId, paymentMethod, total, tables]);

  useEffect(() => {
    if (paymentStatus === "success" && !orderResult && !submitting) executeCheckout(true);
  }, [paymentStatus, orderResult, submitting, executeCheckout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Categories */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-muted border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === null 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryId === cat.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                className="bg-card border border-border rounded-xl p-3 hover:border-accent transition-colors text-left group"
              >
                <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                  {p.imageUrl ? (
                    <img 
                      src={`${IMAGE_BASE_URL}/${p.imageUrl.split(',')[0].trim()}`} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">{p.name}</p>
                <p className="text-sm font-semibold text-accent">{p.price.toLocaleString()}d</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart (Desktop) */}
      <div className="hidden lg:flex w-80 flex-col bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Cart</span>
          </div>
          <span className="text-sm text-muted-foreground">{cartItems.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img src={`${IMAGE_BASE_URL}/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-sm text-accent">{(item.product.price * item.quantity).toLocaleString()}d</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)} 
                    className="w-7 h-7 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)} 
                    className="w-7 h-7 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.productId)} 
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-semibold text-foreground">{total.toLocaleString()}d</span>
          </div>
          <button 
            onClick={() => setShowCheckout(true)} 
            disabled={cartItems.length === 0} 
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Cart Button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => setShowMobileCart(true)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {cartItems.length}
              </span>
            )}
          </div>
          <span className="font-medium">{total.toLocaleString()}d</span>
        </button>
      </div>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Cart</h2>
            <button onClick={() => setShowMobileCart(false)} className="p-2 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.map(item => (
              <div key={item.productId} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img src={`${IMAGE_BASE_URL}/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.product.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-accent">{(item.product.price * item.quantity).toLocaleString()}d</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-semibold">{total.toLocaleString()}d</span>
            </div>
            <button 
              onClick={() => { setShowMobileCart(false); setShowCheckout(true); }} 
              className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-lg"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Checkout</h2>
              <button onClick={() => { setShowCheckout(false); setOrderResult(null); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!orderResult ? (
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono text-foreground">{tempOrderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="text-foreground">{new Date().toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <label className="text-sm text-muted-foreground mb-2 block">Table</label>
                      <div className="relative">
                        <select 
                          value={selectedTableId} 
                          onChange={(e) => setSelectedTableId(Number(e.target.value))} 
                          className="w-full p-3 bg-background border border-border rounded-lg text-sm appearance-none cursor-pointer pr-10"
                        >
                          {tables.filter(t => t.name?.includes("Mang")).map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Default)</option>
                          ))}
                          {tables.filter(t => !t.name?.includes("Mang") && t.status === "Available").map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">{cartItems.length} items</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {cartItems.map(item => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-foreground">{item.product.name} x{item.quantity}</span>
                          <span className="text-muted-foreground">{(item.product.price * item.quantity).toLocaleString()}d</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-3 mt-3 border-t border-border">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-semibold text-accent">{total.toLocaleString()}d</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <button 
                      onClick={() => setPaymentMethod("Cash")} 
                      className={`flex-1 py-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        paymentMethod === 'Cash' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      <Banknote className="w-4 h-4" /> Cash
                    </button>
                    <button 
                      onClick={() => setPaymentMethod("Transfer")} 
                      className={`flex-1 py-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        paymentMethod === 'Transfer' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Transfer
                    </button>
                  </div>

                  {/* QR Code for Transfer */}
                  {paymentMethod === "Transfer" && (
                    <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center">
                      {paymentStatus === "success" ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-medium text-success">Payment Successful</p>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={`https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.acc}&bank=${SEPAY_CONFIG.bank}&amount=${total}&des=${tempOrderId}&template=compact`} 
                            alt="QR" 
                            className="w-40 h-40 rounded-lg" 
                          />
                          <p className="text-xs text-muted-foreground mt-3 text-center">Scan with your banking app</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowCheckout(false)} 
                      className="flex-1 py-3 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                    {paymentMethod === "Cash" ? (
                      <button 
                        onClick={() => executeCheckout(true)} 
                        disabled={submitting} 
                        className="flex-1 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Order"}
                      </button>
                    ) : (
                      <div className="flex-1 py-3 bg-accent/10 text-accent text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Waiting...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Order Complete</h3>
                  <p className="text-sm text-muted-foreground mb-6">Order {tempOrderId} has been saved</p>
                  <button 
                    onClick={() => { setCartItems([]); setShowCheckout(false); setOrderResult(null); window.location.reload(); }} 
                    className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg"
                  >
                    New Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
