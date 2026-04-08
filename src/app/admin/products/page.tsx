"use client";
import React, { useMemo } from "react";
import { API_BASE_URL, IMAGE_BASE_URL } from "@/app/api/apiConfig";
import { ProductForm, Product, Category as ProductCategory } from "@/components/ProductForm";
import { CategoryForm, Category } from "@/components/CategoryForm";
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Tag, 
  X, 
  Loader2, 
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const pageSize = 12;

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [showProductForm, setShowProductForm] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>(undefined);
  const [formLoading, setFormLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | undefined>(undefined);
  const [categoryLoading, setCategoryLoading] = React.useState(false);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/category`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        const cats = res.data.sort((a: Category, b: Category) => a.displayOrder - b.displayOrder);
        setCategories(cats);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  const fetchProducts = React.useCallback(async (page: number, catId: number | null, search: string) => {
    try {
      const query = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
        ...(catId && { categoryId: catId.toString() }),
        ...(search && { searchTerm: search })
      }).toString();

      const res = await fetch(`/api/product?${query}`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        setProducts(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
        setCurrentPage(res.data.pageNumber);
      } else {
        setError(res.message || "Lỗi tải danh mục sản phẩm");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  React.useEffect(() => {
    fetchProducts(currentPage, selectedCategoryId, searchQuery);
  }, [fetchProducts, currentPage, selectedCategoryId, searchQuery]);

  const handleProductSubmit = async (data: Omit<Product, "id">) => {
    setFormLoading(true); 
    setMessage(null); 
    setError(null);
    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/product?id=${editingProduct.id}`, {
          method: "PUT", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: editingProduct.id }),
        });
      } else {
        res = await fetch(`/api/product`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(editingProduct ? "Product updated" : "Product created");
        fetchProducts(currentPage, selectedCategoryId, searchQuery); 
        setShowProductForm(false); 
        setEditingProduct(undefined);
      } else {
        setError(result.message || "Operation failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleProductDelete = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;
    setFormLoading(true); 
    setError(null); 
    setMessage(null);
    try {
      const res = await fetch(`/api/product?id=${id}`, { 
        method: "DELETE"
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage("Product deleted");
        fetchProducts(currentPage, selectedCategoryId, searchQuery);
      } else {
        setError(result.message || "Delete failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleCategorySubmit = async (data: Omit<Category, "id">) => {
    setCategoryLoading(true); 
    setMessage(null); 
    setError(null);
    try {
      let res;
      if (editingCategory) {
        res = await fetch(`/api/category?id=${editingCategory.id}`, {
          method: "PUT", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: editingCategory.id }),
        });
      } else {
        res = await fetch(`/api/category`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(editingCategory ? "Category updated" : "Category created");
        fetchCategories(); 
        fetchProducts(currentPage, selectedCategoryId, searchQuery); 
        setShowCategoryForm(false); 
        setEditingCategory(undefined);
      } else {
        setError(result.message || "Operation failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setCategoryLoading(false); 
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!window.confirm("Delete this category?")) return;
    setCategoryLoading(true); 
    setError(null); 
    setMessage(null);
    try {
      const res = await fetch(`/api/category?id=${id}`, { 
        method: "DELETE"
      });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage("Category deleted");
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        fetchCategories(); 
        fetchProducts(currentPage, selectedCategoryId, searchQuery);
      } else {
        setError(result.message || "Delete failed");
      }
    } catch { 
      setError("Connection error"); 
    } finally { 
      setCategoryLoading(false); 
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ thống sản phẩm</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ thực đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-10">
        <div>
           <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/30 italic rotate-6">🍱</div>
                <div>
                     <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none mb-2">Quản lý <span className="text-indigo-600">Thực đơn</span></h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">Điều chỉnh danh mục và các món ăn trong hệ thống</p>
                </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-[1.8rem] border border-zinc-100 dark:border-zinc-800 shadow-xl group cursor-pointer lg:w-72">
            <Search className="w-5 h-5 text-zinc-400 ml-3 group-hover:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-black text-xs uppercase text-zinc-900 dark:text-white p-2 w-full cursor-pointer placeholder:text-zinc-300"
            />
          </div>
          <button
            onClick={() => { setShowProductForm(true); setEditingProduct(undefined); }}
            className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-zinc-950/10 active:scale-95 text-xs uppercase tracking-widest cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> THÊM MÓN MỚI
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {(error || message) && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {error || message}
        </div>
      )}

      {/* Categories & Products */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Danh mục</h2>
              <button 
                onClick={() => { setShowCategoryForm(true); setEditingCategory(undefined); }}
                className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Thêm danh mục"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible no-scrollbar pb-4 lg:pb-0">
              <button 
                onClick={() => setSelectedCategoryId(null)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategoryId === null 
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl shadow-zinc-950/20 italic rotate-1' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" /> Tất cả ({totalCount})
              </button>

              {categories.map(cat => (
                <div key={cat.id} className="relative group">
                  <button 
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer border ${
                      selectedCategoryId === cat.id 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-900/20 italic rotate-1' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <Tag className="w-4 h-4" /> {cat.name}
                  </button>
                  <div className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryForm(true); }}
                      className="w-7 h-7 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id); }}
                      className="w-7 h-7 rounded-lg bg-rose-50/80 dark:bg-rose-900/20 backdrop-blur-md flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 opacity-20">
                <Package className="w-20 h-20 mb-6 stroke-[1.5]" />
                <p className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Không tìm thấy sản phẩm</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                        <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sản phẩm</th>
                        <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Danh mục</th>
                        <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Đơn giá</th>
                        <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right w-20">Tương tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map(p => (
                        <tr key={p.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer">
                          <td className="py-6 px-10">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center">
                                {p.imageUrl ? (
                                  <img src={`${IMAGE_BASE_URL}/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
                                )}
                              </div>
                              <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-6 px-10">
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              {categories.find(c => c.id === p.categoryId)?.name || "Chưa rõ"}
                            </span>
                          </td>
                          <td className="py-6 px-10 text-right">
                            <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">{p.price.toLocaleString()}đ</span>
                          </td>
                          <td className="py-6 px-10 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => { setShowProductForm(true); setEditingProduct(p); }}
                                className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleProductDelete(p.id)}
                                className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 grid gap-3">
                  {products.map(p => (
                    <div key={p.id} className="bg-background border border-border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {p.imageUrl ? (
                          <img src={`${IMAGE_BASE_URL}/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{categories.find(c => c.id === p.categoryId)?.name || "-"}</p>
                        <p className="text-sm font-medium text-accent mt-1">{p.price.toLocaleString()}d</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => { setShowProductForm(true); setEditingProduct(p); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleProductDelete(p.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-border">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{editingProduct ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => { setShowProductForm(false); setEditingProduct(undefined); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ProductForm 
                product={editingProduct}
                categories={categories}
                onSubmit={handleProductSubmit}
                onCancel={() => { setShowProductForm(false); setEditingProduct(undefined); }}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{editingCategory ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => { setShowCategoryForm(false); setEditingCategory(undefined); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <CategoryForm 
                category={editingCategory}
                onSubmit={handleCategorySubmit}
                onCancel={() => { setShowCategoryForm(false); setEditingCategory(undefined); }}
                loading={categoryLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
