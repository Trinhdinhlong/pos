import React from "react";
import { Loader2 } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Category Name <span className="text-destructive">*</span>
        </label>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter category name..."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Display Order <span className="text-destructive">*</span>
        </label>
        <input
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          type="number"
          min={1}
          value={displayOrder}
          onChange={e => setDisplayOrder(e.target.value)}
          placeholder="1"
          required
        />
      </div>
      <div className="flex gap-3 pt-4 border-t border-border">
        <button 
          type="button" 
          className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors" 
          onClick={onCancel} 
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="flex-1 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2" 
          disabled={loading}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : category ? "Save Changes" : "Create Category"}
        </button>
      </div>
    </form>
  );
}
