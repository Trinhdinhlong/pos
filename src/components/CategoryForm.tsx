import React from "react";

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

export interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: Omit<Category, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, loading }: CategoryFormProps) {
  const [name, setName] = React.useState(category?.name || "");
  const [displayOrder, setDisplayOrder] = React.useState(category?.displayOrder?.toString() || "1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !displayOrder) return;
    onSubmit({
      name,
      displayOrder: Number(displayOrder),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Tên danh mục <span className="text-red-500">*</span></label>
        <input
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 dark:text-white"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nhập tên ví dụ: Đồ uống..."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Thứ tự hiển thị <span className="text-red-500">*</span></label>
        <input
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 dark:text-white"
          type="number"
          min={1}
          value={displayOrder}
          onChange={e => setDisplayOrder(e.target.value)}
          placeholder="Ví dụ: 1"
          required
        />
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          type="button" 
          className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-3 rounded-xl font-medium transition-colors" 
          onClick={onCancel} 
          disabled={loading}
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" 
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98]" 
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : category ? "Lưu thay đổi" : "Tạo danh mục"}
        </button>
      </div>
    </form>
  );
}
