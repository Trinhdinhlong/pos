"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Edit2, Trash2, Shield, User as UserIcon, ChevronLeft, ChevronRight, AlertCircle, Loader2, X, MoreVertical, Fingerprint } from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  passwordHash?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

const emptyUser: Partial<User> = {
  username: "",
  fullName: "",
  role: "Staff",
  passwordHash: "",
  password: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formUser, setFormUser] = useState<Partial<User>>(emptyUser);
  const [isEdit, setIsEdit] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 6;

  // Fetch users
  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user?pageNumber=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.status === 200 || data.status === true || data.status === "success") {
        setUsers(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotalCount(data.data.totalCount);
        setCurrentPage(data.data.pageNumber);
      }
      else setError(data.message || "Lỗi tải danh sách tài khoản");
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  // Handle add/edit user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `/users/${formUser.id}` : `/users`;

    const payload = isEdit ? {
      id: formUser.id,
      fullName: formUser.fullName,
      role: formUser.role,
      passwordHash: formUser.passwordHash
    } : {
      username: formUser.username,
      fullName: formUser.fullName,
      role: formUser.role,
      passwordHash: formUser.passwordHash
    };

    try {
      const res = await fetch(isEdit ? `/api/user?id=${formUser.id}` : `/api/user`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 200 || data.status === 201 || data.status === true || data.status === "success") {
        setMessage(isEdit ? "Cập nhật thành công!" : "Tạo tài khoản mới thành công!");
        setShowForm(false);
        setFormUser(emptyUser);
        setIsEdit(false);
        fetchUsers(currentPage);
      } else {
        alert(data.message || "Lỗi thao tác tài khoản");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete user
  const handleDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xoá tài khoản này vĩnh viễn?")) return;
    try {
      const res = await fetch(`/api/user?id=${id}`, { 
        method: "DELETE"
      });
      const data = await res.json();
      if (data.status === 200 || data.status === true || data.status === "success") {
          setMessage("Đã xóa tài khoản.");
          fetchUsers(currentPage);
      } else alert(data.message || "Lỗi xoá user");
    } catch {
      alert("Lỗi kết nối máy chủ");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-card rounded-xl min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-foreground font-medium text-base">Tài Khoản</p>
            <p className="text-muted-foreground text-xs mt-1">Đang tải dữ liệu...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Tài Khoản</h1>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản và phân quyền nhân viên</p>
        </div>

        <button
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all cursor-pointer text-sm whitespace-nowrap"
          onClick={() => {
            setShowForm(true);
            setFormUser(emptyUser);
            setIsEdit(false);
          }}
        >
          <UserPlus className="w-4 h-4" /> Thêm tài khoản
        </button>
      </div>

      {/* STATUS BLOCK */}
      {(error || message) && (
        <div className={`p-3 rounded-lg border flex items-center text-sm ${error ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-success/10 border-success/30 text-success'}`}>
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span className="font-medium">{error || message}</span>
        </div>
      )}

      {/* MAIN CONTENT: TABLE ON LAPTOP, CARDS ON MOBILE/IPAD */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          
          {/* MOBILE CARDS VIEW */}
          <div className="grid md:hidden grid-cols-1 gap-3 p-4">
               {users.length === 0 ? (
                    <div className="py-16 text-center opacity-30">
                        <Fingerprint className="w-12 h-12 mx-auto mb-3" />
                        <p className="font-medium text-xs tracking-wide">Không có dữ liệu nhân sự</p>
                    </div>
               ) : users.map(u => (
                    <div key={u.id} className="bg-secondary rounded-lg border border-border p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                             <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold text-sm ${u.role === 'Admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {u.role === 'Admin' ? <Shield className="w-5 h-5" /> : u.fullName.charAt(0).toUpperCase()}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground text-sm truncate">{u.fullName}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                     <span className="text-xs text-muted-foreground">{u.username}</span>
                                     <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${u.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role === 'Admin' ? 'Admin' : 'Staff'}</span>
                                </div>
                             </div>
                        </div>
                        {u.role !== 'Admin' && (
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                 <button onClick={() => { setShowForm(true); setFormUser(u); setIsEdit(true); }} className="flex-1 py-2 bg-muted text-muted-foreground rounded text-xs font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/80"><Edit2 className="w-3 h-3" /> Sửa</button>
                                 <button onClick={() => handleDelete(u.id)} className="flex-1 py-2 bg-destructive/10 text-destructive rounded text-xs font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-destructive/20"><Trash2 className="w-3 h-3" /> Xóa</button>
                            </div>
                        )}
                    </div>
               ))}
          </div>

          {/* LAPTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary">
                  <th className="py-4 px-6 text-xs font-semibold text-muted-foreground">ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted-foreground">Tài khoản</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted-foreground">Họ và tên</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted-foreground">Ngày gia nhập</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted-foreground text-right">Tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                            <Fingerprint className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">Danh sách nhân viên trống</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary transition-colors">
                      <td className="py-4 px-6">
                           <span className="text-sm text-muted-foreground">#{u.id}</span>
                      </td>
                      <td className="py-4 px-6">
                           <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-medium text-sm ${u.role === 'Admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {u.role === 'Admin' ? <Shield className="w-4 h-4" /> : u.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                     <p className="text-sm font-medium text-foreground">{u.username}</p>
                                     <span className={`text-xs ${u.role === 'Admin' ? 'text-primary' : 'text-muted-foreground'}`}>
                                          {u.role === 'Admin' ? 'Admin' : 'Staff'}
                                     </span>
                                </div>
                           </div>
                      </td>
                      <td className="py-4 px-6">
                           <span className="text-sm text-foreground">{u.fullName}</span>
                      </td>
                      <td className="py-4 px-6">
                           <span className="text-sm text-muted-foreground">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                           </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.role !== 'Admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="w-8 h-8 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors flex items-center justify-center cursor-pointer"
                              onClick={() => { setShowForm(true); setFormUser(u); setIsEdit(true); }}
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              className="w-8 h-8 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors flex items-center justify-center cursor-pointer"
                              onClick={() => handleDelete(u.id)}
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto p-4 border-t border-border bg-secondary">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
          </div>
      </div>

      {/* FORM MODAL: FULLSCREEN ON MOBILE, CENTERED ON LAPTOP */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in" onClick={() => !formLoading && setShowForm(false)}>
          <div className="bg-card w-full sm:max-w-md sm:rounded-lg shadow-lg overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary">
                <h2 className="text-lg font-semibold text-foreground">
                  {isEdit ? "Cập nhật nhân viên" : "Tạo tài khoản mới"}
                </h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
                    <X className="w-4 h-4" />
                </button>
              </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block mb-2 text-xs font-medium text-muted-foreground">Tên đăng nhập</label>
                    <input
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground disabled:opacity-50"
                      value={formUser.username || ""}
                      onChange={e => setFormUser(f => ({ ...f, username: e.target.value }))}
                      required
                      disabled={isEdit}
                      placeholder="nhanvien01"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-xs font-medium text-muted-foreground">
                      {isEdit ? "Mật khẩu mới (nếu cần)" : "Mật khẩu"}
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                      value={formUser.passwordHash || ""}
                      onChange={e => setFormUser((f: any) => ({ ...f, passwordHash: e.target.value }))}
                      required={!isEdit}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-xs font-medium text-muted-foreground">Họ và tên</label>
                    <input
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                      value={formUser.fullName || ""}
                      onChange={e => setFormUser(f => ({ ...f, fullName: e.target.value }))}
                      required
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-xs font-medium text-muted-foreground">Quyền hạn</label>
                    <select
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      value={formUser.role || "Staff"}
                      onChange={e => setFormUser(f => ({ ...f, role: e.target.value }))}
                      required
                      disabled={true}
                    >
                      <option value="Staff">Nhân viên</option>
                      <option value="Admin">Quản trị</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      isEdit ? "Cập nhật" : "Tạo tài khoản"
                    )}
                  </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
