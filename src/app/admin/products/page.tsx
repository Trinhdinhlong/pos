"use client";
import React, { useMemo } from "react";
import { apiClient } from "@/lib/apiClient";
import { ProductForm, Product, Category as ProductCategory } from "@/components/ProductForm";
import { CategoryForm, Category } from "@/components/CategoryForm";
import { Package, Tags, Plus, Edit2, Trash2, Search, Coffee, Tag, LayoutGrid, PackageOpen, ChevronLeft, ChevronRight, MoreVertical, Layers, X, Loader2, AlertCircle } from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function ProductsPage() {
  // Data state
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const pageSize = 12; // Increase for better grid layout

  // UI state
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Form states
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>(undefined);
  const [formLoading, setFormLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | undefined>(undefined);
  const [categoryLoading, setCategoryLoading] = React.useState(false);

  // Fetch categories (once)
  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await apiClient(`/categories`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        const cats = res.data.sort((a: Category, b: Category) => a.displayOrder - b.displayOrder);
        setCategories(cats);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  // Fetch products (paged and filtered)
  const fetchProducts = React.useCallback(async (page: number, catId: number | null, search: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
        ...(catId && { categoryId: catId.toString() }),
        ...(search && { searchTerm: search })
      }).toString();

      const res = await apiClient(`/products?${query}`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        setProducts(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
        setCurrentPage(res.data.pageNumber);
      } else {
        setError(res.message || "Lỗi tải sản phẩm");
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

  // --- Handlers ---
  const handleProductSubmit = async (data: Omit<Product, "id">) => {
    setFormLoading(true); setMessage(null); setError(null);
    try {
      let res;
      if (editingProduct) {
        res = await apiClient(`/products/${editingProduct.id}`, {
          method: "PUT", body: JSON.stringify({ ...data, id: editingProduct.id }),
        });
      } else {
        res = await apiClient(`/products`, {
          method: "POST", body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(result.message || (editingProduct ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công"));
        fetchProducts(currentPage, selectedCategoryId, searchQuery); setShowProductForm(false); setEditingProduct(undefined);
      } else setError(result.message || "Lỗi thao tác");
    } catch { setError("Lỗi kết nối máy chủ"); } finally { setFormLoading(false); }
  };

  const handleProductDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xóa sản phẩm vĩnh viễn?")) return;
    setFormLoading(true); setError(null); setMessage(null);
    try {
      const res = await apiClient(`/products/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(result.message || "Xóa sản phẩm thành công");
        fetchProducts(currentPage, selectedCategoryId, searchQuery);
      } else setError(result.message || "Lỗi xóa sản phẩm");
    } catch { setError("Lỗi kết nối máy chủ"); } finally { setFormLoading(false); }
  };

  const handleCategorySubmit = async (data: Omit<Category, "id">) => {
    setCategoryLoading(true); setMessage(null); setError(null);
    try {
      let res;
      if (editingCategory) {
        res = await apiClient(`/categories/${editingCategory.id}`, {
          method: "PUT", body: JSON.stringify({ ...data, id: editingCategory.id }),
        });
      } else {
        res = await apiClient(`/categories`, {
          method: "POST", body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(result.message || (editingCategory ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công"));
        fetchCategories(); fetchProducts(currentPage, selectedCategoryId, searchQuery); setShowCategoryForm(false); setEditingCategory(undefined);
      } else setError(result.message || "Lỗi thao tác danh mục");
    } catch { setError("Lỗi kết nối máy chủ"); } finally { setCategoryLoading(false); }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xóa danh mục? Các sản phẩm thuộc danh mục này có thể mất liên kết.")) return;
    setCategoryLoading(true); setError(null); setMessage(null);
    try {
      const res = await apiClient(`/categories/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(result.message || "Xóa danh mục thành công");
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        fetchCategories(); fetchProducts(currentPage, selectedCategoryId, searchQuery);
      } else setError(result.message || "Lỗi xóa danh mục");
    } catch { setError("Lỗi kết nối"); } finally { setCategoryLoading(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      <div className="flex flex-col items-center animate-pulse">
        <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">POS SYSTEM</p>
        <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ Menu...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-xl shadow-xl shadow-zinc-950/20 italic rotate-3">P</div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">Quản lý Menu</h1>
          </div>
          <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">Hệ thống quản trị thực đơn chuyên nghiệp</p>
        </div>

        <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Tìm món nhanh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all shadow-sm"
                />
            </div>
            <button
                onClick={() => { setShowProductForm(true); setEditingProduct(undefined); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-xs uppercase tracking-widest shrink-0 cursor-pointer"
            >
                <Plus className="w-4 h-4" /> THÊM MÓN MỚI
            </button>
        </div>
      </div>

      {/* STATUS BLOCK */}
      {(error || message) && (
        <div className={`p-4 rounded-2xl border flex items-center shadow-sm animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <span className="font-bold text-sm uppercase tracking-tight">{error || message}</span>
        </div>
      )}

      {/* CATEGORIES NAVIGATION (RESPONSIVE CHIPS FOR MOBILE, SIDEBAR FOR LAPTOP) */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* CATEGORY SIDEBAR / HEADER CHIPS */}
        <aside className="w-full xl:w-72 shrink-0">
             <div className="flex xl:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 xl:pb-0 sticky top-24">
                <div className="hidden xl:flex items-center justify-between mb-4 px-4">
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Danh mục</h2>
                    <button 
                        onClick={() => { setShowCategoryForm(true); setEditingCategory(undefined); }}
                        className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <button 
                   onClick={() => setSelectedCategoryId(null)}
                   className={`flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap min-w-fit shadow-sm ${selectedCategoryId === null ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-100 dark:border-zinc-800'}`}
                >
                    <div className="flex items-center gap-2.5"><LayoutGrid className="w-4 h-4 shrink-0" /> TẤT CẢ</div>
                    <span className={`ml-3 px-2 py-0.5 rounded-md text-[9px] ${selectedCategoryId === null ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>{totalCount}</span>
                </button>

                {categories.map(cat => (
                    <div key={cat.id} className="relative group min-w-fit xl:min-w-0">
                         <button 
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap shadow-sm ${selectedCategoryId === cat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-100 dark:border-zinc-800'}`}
                         >
                            <div className="flex items-center gap-2.5"><Tag className="w-4 h-4 shrink-0" /> {cat.name}</div>
                            <div className="hidden xl:flex items-center ml-2 border-l border-white/10 pl-2 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="w-3 h-3 hover:scale-125 transition-transform" onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryForm(true); }} />
                                <Trash2 className="w-3 h-3 hover:scale-125 transition-transform text-rose-300" onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id); }} />
                            </div>
                         </button>
                    </div>
                ))}

                {/* Mobile-only quick add */}
                <button 
                   onClick={() => { setShowCategoryForm(true); setEditingCategory(undefined); }}
                   className="xl:hidden flex items-center gap-2 px-5 py-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> THÊM
                </button>
             </div>
        </aside>

        {/* PRODUCTS CONTENT: TABLE ON LAPTOP, CARDS ON MOBILE/IPAD */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full">
            
            {/* PRODUCT GRID FOR MOBILE/TABLET */}
            <div className="md:hidden p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                 {products.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <PackageOpen className="w-16 h-16 mx-auto text-zinc-200" />
                        <p className="font-bold text-zinc-400 text-sm uppercase tracking-widest italic">Trống héo...</p>
                    </div>
                 ) : products.map(p => (
                    <div key={p.id} className="bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700/50 p-4 shadow-sm relative group overflow-hidden">
                        <div className="flex items-center gap-4">
                             <div className="w-20 h-20 rounded-3xl bg-zinc-50 dark:bg-zinc-700 overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-600">
                                {p.imageUrl ? (
                                    <img src={`http://localhost:5298/api/images/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-200 dark:text-zinc-600"><Coffee className="w-10 h-10" /></div>
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full mb-1 inline-block border border-emerald-100 dark:border-emerald-800">
                                    {categories.find(c => c.id === p.categoryId)?.name || "N/A"}
                                </span>
                                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-sm truncate">{p.name}</h3>
                                <p className="text-emerald-600 font-black text-base italic leading-none mt-1">{p.price.toLocaleString()}đ</p>
                             </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-700/50">
                             <button onClick={() => { setShowProductForm(true); setEditingProduct(p); }} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5"><Edit2 className="w-3 h-3" /> SỬA</button>
                             <button onClick={() => handleProductDelete(p.id)} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> XÓA</button>
                        </div>
                    </div>
                 ))}
            </div>

            {/* PRODUCT TABLE FOR LAPTOP/TABLET LANDSCAPE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="py-6 px-8 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Thông tin món</th>
                    <th className="py-6 px-8 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Danh mục phân loại</th>
                    <th className="py-6 px-8 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Đơn giá niêm yết</th>
                    <th className="py-6 px-8 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Tương tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {products.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="py-32 text-center">
                            <div className="flex flex-col items-center opacity-30">
                                <PackageOpen className="w-20 h-20 text-zinc-300 dark:text-zinc-700 mb-6 stroke-[1.5]" />
                                <p className="text-sm font-black uppercase tracking-[0.3em]">Thực đơn đang trống</p>
                            </div>
                        </td>
                     </tr>
                  ) : products.map(p => {
                    const catName = categories.find(c => c.id === p.categoryId)?.name || "Không phân loại";
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.8rem] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700 overflow-hidden shadow-sm shadow-zinc-200/10 group-hover:scale-105 transition-transform">
                              {p.imageUrl ? (
                                <img src={`http://localhost:5298/api/images/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Coffee className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter text-sm mb-1 group-hover:text-emerald-600 transition-colors">{p.name}</div>
                              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic opacity-60">ID: #{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <span className="px-4 py-2 text-[10px] font-black rounded-xl bg-zinc-100/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700">
                             {catName}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg italic tracking-tighter">{p.price.toLocaleString()}đ</span>
                        </td>
                        <td className="py-6 px-8 text-right px-8">
                          <div className="flex items-center justify-end gap-3 translate-x-0">
                            <button
                              onClick={() => { setShowProductForm(true); setEditingProduct(p); }}
                              className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-90"
                              title="Chỉnh sửa chi tiết"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleProductDelete(p.id)}
                              className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-90"
                              title="Xóa món khỏi hệ thống"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-8 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/20">
                <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                />
            </div>
          </div>
        </div>

      </div>

      {/* MODAL SECTION: FULL SCREEN ON MOBILE, CENTERED ON LAPTOP */}
      {showProductForm && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-0 sm:p-4 animate-in fade-in transition-all" onClick={() => !formLoading && setShowProductForm(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
                {editingProduct ? "Cập nhật món ăn" : "Thêm vào thực đơn"}
              </h2>
              <button 
                onClick={() => setShowProductForm(false)} 
                className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <ProductForm
                categories={categories}
                product={editingProduct}
                onSubmit={handleProductSubmit}
                onCancel={() => { setShowProductForm(false); setEditingProduct(undefined); }}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in" onClick={() => !categoryLoading && setShowCategoryForm(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
                Cấu trúc danh mục
              </h2>
              <button 
                onClick={() => setShowCategoryForm(false)} 
                className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
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
