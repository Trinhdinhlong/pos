"use client";
import React, { useMemo } from "react";
import { apiClient } from "@/lib/apiClient";
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
      const res = await apiClient(`/categories`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        const cats = res.data.sort((a: Category, b: Category) => a.displayOrder - b.displayOrder);
        setCategories(cats);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

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
        setError(res.message || "Failed to load products");
      }
    } catch {
      setError("Connection error");
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
        res = await apiClient(`/products/${editingProduct.id}`, {
          method: "PUT", 
          body: JSON.stringify({ ...data, id: editingProduct.id }),
        });
      } else {
        res = await apiClient(`/products`, {
          method: "POST", 
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
      const res = await apiClient(`/products/${id}`, { method: "DELETE" });
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
        res = await apiClient(`/categories/${editingCategory.id}`, {
          method: "PUT", 
          body: JSON.stringify({ ...data, id: editingCategory.id }),
        });
      } else {
        res = await apiClient(`/categories`, {
          method: "POST", 
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
      const res = await apiClient(`/categories/${id}`, { method: "DELETE" });
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your menu items</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => { setShowProductForm(true); setEditingProduct(undefined); }}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Product
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
        <aside className="lg:w-56 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">Categories</h2>
            <button 
              onClick={() => { setShowCategoryForm(true); setEditingCategory(undefined); }}
              className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar">
            <button 
              onClick={() => setSelectedCategoryId(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === null 
                  ? 'bg-foreground text-background' 
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="w-4 h-4" /> All ({totalCount})
            </button>

            {categories.map(cat => (
              <div key={cat.id} className="relative group">
                <button 
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryId === cat.id 
                      ? 'bg-foreground text-background' 
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Tag className="w-4 h-4" /> {cat.name}
                </button>
                <div className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryForm(true); }}
                    className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id); }}
                    className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Product</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Category</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Price</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                {p.imageUrl ? (
                                  <img src={`http://localhost:5298/api/images/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-foreground">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {categories.find(c => c.id === p.categoryId)?.name || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium text-accent">{p.price.toLocaleString()}d</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => { setShowProductForm(true); setEditingProduct(p); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleProductDelete(p.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
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
                          <img src={`http://localhost:5298/api/images/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover" />
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
