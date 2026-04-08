"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
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
  const pageSize = 12;

  // Fetch users
  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/users?pageNumber=${page}&pageSize=${pageSize}`);
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
      const res = await apiClient(url, {
        method,
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
      const res = await apiClient(`/users/${id}`, { method: "DELETE" });
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
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">POS SYSTEM</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ dữ liệu...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-[1.5rem] bg-zinc-900 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-zinc-950/20 italic rotate-3">P</div>
                <div>
                     <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic leading-none mb-1">Đội ngũ nhân sự</h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Quản lý tài khoản truy cập và quyền hạn của nhân viên</p>
                </div>
           </div>
        </div>

        <button
          className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-zinc-950/10 active:scale-95 text-xs uppercase tracking-widest"
          onClick={() => {
            setShowForm(true);
            setFormUser(emptyUser);
            setIsEdit(false);
          }}
        >
          <UserPlus className="w-5 h-5" /> THÊM TÀI KHOẢN
        </button>
      </div>

      {/* STATUS BLOCK */}
      {(error || message) && (
        <div className={`p-4 rounded-2xl border flex items-center shadow-sm animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <span className="font-bold text-sm uppercase tracking-tight">{error || message}</span>
        </div>
      )}

      {/* MAIN CONTENT: TABLE ON LAPTOP, CARDS ON MOBILE/IPAD */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          
          {/* MOBILE CARDS VIEW */}
          <div className="grid md:hidden grid-cols-1 gap-4 p-4">
               {users.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <Fingerprint className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-black uppercase text-xs tracking-widest">Không có dữ liệu</p>
                    </div>
               ) : users.map(u => (
                    <div key={u.id} className="bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700/50 p-6 flex flex-col gap-4 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden group">
                        <div className="flex items-center gap-4">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg italic ${u.role === 'Admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}>
                                {u.role === 'Admin' ? <Shield className="w-6 h-6" /> : u.fullName.charAt(0).toUpperCase()}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-base truncate leading-none mb-1">{u.fullName}</h3>
                                <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{u.username}</span>
                                     <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${u.role === 'Admin' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>{u.role}</span>
                                </div>
                             </div>
                        </div>
                        {u.role !== 'Admin' && (
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-50 dark:border-zinc-700/50">
                                 <button onClick={() => { setShowForm(true); setFormUser(u); setIsEdit(true); }} className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-zinc-100 dark:border-zinc-700"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                                 <button onClick={() => handleDelete(u.id)} className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                            </div>
                        )}
                    </div>
               ))}
          </div>

          {/* LAPTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">ID Hệ thống</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tài khoản & Phân quyền</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Họ và tên</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ngày gia nhập</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center opacity-20">
                            <Fingerprint className="w-20 h-20 mb-6 stroke-[1.5]" />
                            <p className="text-sm font-black uppercase tracking-[0.3em]">Danh sách nhân viên trống</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all group">
                      <td className="py-6 px-10">
                           <span className="font-black text-zinc-900 dark:text-white italic tracking-tighter opacity-30 group-hover:opacity-100 transition-opacity">#{u.id}</span>
                      </td>
                      <td className="py-6 px-10">
                           <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic shadow-sm group-hover:scale-110 transition-transform ${u.role === 'Admin' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    {u.role === 'Admin' ? <Shield className="w-5 h-5" /> : u.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                     <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{u.username}</p>
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${u.role === 'Admin' ? 'text-indigo-500' : 'text-zinc-400'}`}>
                                          {u.role}
                                     </span>
                                </div>
                           </div>
                      </td>
                      <td className="py-6 px-10">
                           <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">{u.fullName}</span>
                      </td>
                      <td className="py-6 px-10">
                           <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                           </span>
                      </td>
                      <td className="py-6 px-10 text-right">
                        {u.role !== 'Admin' && (
                          <div className="flex items-center justify-end gap-3 transition-all transform translate-x-0">
                            <button
                              className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all flex items-center justify-center active:scale-90"
                              onClick={() => { setShowForm(true); setFormUser(u); setIsEdit(true); }}
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center active:scale-90"
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

          <div className="mt-auto p-8 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/20">
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
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center z-[70] p-0 sm:p-4 animate-in fade-in" onClick={() => !formLoading && setShowForm(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">
                  {isEdit ? "Cập nhật nhân viên" : "Tạo tài khoản mới"}
                </h2>
                <button onClick={() => setShowForm(false)} className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all shadow-sm">
                    <X className="w-5 h-5" />
                </button>
              </div>
            <div className="p-8 pb-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tên đăng nhập</label>
                    <input
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 placeholder:text-zinc-300 disabled:opacity-50"
                      value={formUser.username || ""}
                      onChange={e => setFormUser(f => ({ ...f, username: e.target.value }))}
                      required
                      disabled={isEdit}
                      placeholder="vd: nhanvien01"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      {isEdit ? "Mật khẩu mới (Bỏ trống nếu giữ cũ)" : "Mật khẩu truy cập"}
                    </label>
                    <input
                      type="password"
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 placeholder:text-zinc-300"
                      value={formUser.passwordHash || ""}
                      onChange={e => setFormUser((f: any) => ({ ...f, passwordHash: e.target.value }))}
                      required={!isEdit}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Họ và tên đầy đủ</label>
                    <input
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 placeholder:text-zinc-300"
                      value={formUser.fullName || ""}
                      onChange={e => setFormUser(f => ({ ...f, fullName: e.target.value }))}
                      required
                      placeholder="vd: Nguyễn Văn A"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Quyền hạn hệ thống</label>
                    <select
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 dark:text-white disabled:opacity-50 appearance-none"
                      value={formUser.role || "Staff"}
                      onChange={e => setFormUser(f => ({ ...f, role: e.target.value }))}
                      required
                      disabled={true}
                    >
                      <option value="Staff">STAFF (NHÂN VIÊN)</option>
                      <option value="Admin">ADMIN (QUẢN TRỊ)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-2xl shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest mt-8"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      isEdit ? "CẬP NHẬT TÀI KHOẢN" : "CẤP TÀI KHOẢN MỚI"
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
