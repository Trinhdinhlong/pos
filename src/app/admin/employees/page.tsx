"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { EmployeeForm, Employee } from "@/components/EmployeeForm";
import { 
  Users, 
  Edit2, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Search, 
  UserCheck, 
  Loader2, 
  AlertCircle, 
  Layers, 
  X,
  Shield,
  Briefcase
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch users (as employees)
  const fetchEmployees = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/users?pageNumber=${page}&pageSize=${pageSize}`).then(r => r.json());
      if (res.status === true || res.status === 200 || res.status === "success") {
        setEmployees(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
        setCurrentPage(res.data.pageNumber);
      } else {
        setError(res.message || "Lỗi tải nhân viên");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [fetchEmployees, currentPage]);

  // Thêm mới hoặc cập nhật user (employee)
  const handleSubmit = async (data: any) => {
    setFormLoading(true);
    setMessage(null);
    setError(null);
    try {
      let res;
      if (editingEmployee) {
        const body = {
          id: editingEmployee.id,
          username: data.username,
          password: data.password, 
          fullName: data.fullName,
          role: data.role,
        };
        res = await apiClient(`/users/${editingEmployee.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        const body = {
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          role: "Staff",
        };
        res = await apiClient(`/users`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(result.message || (editingEmployee ? "Cập nhật thành công" : "Thêm mới thành công"));
        fetchEmployees(currentPage);
        setShowForm(false);
        setEditingEmployee(undefined);
      } else {
        setError(result.message || "Lỗi thao tác");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setFormLoading(false);
    }
  };

  // Xóa nhân viên
  const handleDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xóa nhân viên?")) return;
    setFormLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiClient(`/users/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.status === true || result.status === "success" || result.status === 200) {
        setMessage(result.message || "Xóa thành công");
        fetchEmployees(currentPage);
      } else {
        setError(result.message || "Lỗi xóa nhân viên");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && employees.length === 0) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ thống nhân sự</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ dữ liệu...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-600/20 italic rotate-6">E</div>
                <div>
                     <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic leading-none mb-1">Đội ngũ nhân sự</h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Quản lý định danh và quyền hạn truy cập của nhân viên</p>
                </div>
           </div>
        </div>

        <button
          className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-zinc-950/10 active:scale-95 text-xs uppercase tracking-widest"
          onClick={() => { setShowForm(true); setEditingEmployee(undefined); }}
          disabled={formLoading}
        >
          <Plus className="w-5 h-5" /> THÊM NHÂN VIÊN
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
               {employees.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <Users className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-black uppercase text-xs tracking-widest">Trống</p>
                    </div>
               ) : employees.map(e => (
                    <div key={e.id} className="bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700/50 p-6 flex flex-col gap-4 shadow-sm active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-4">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg italic ${e.role === 'Admin' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}>
                                {e.fullName.charAt(0).toUpperCase()}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-base truncate leading-none mb-1">{e.fullName}</h3>
                                <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{e.username}</span>
                                     <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${e.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-100 text-zinc-500'}`}>{e.role}</span>
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-50 dark:border-zinc-700/50">
                             <button onClick={() => { setShowForm(true); setEditingEmployee(e); }} className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-zinc-100 dark:border-zinc-700"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                             <button onClick={() => handleDelete(e.id)} className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                        </div>
                    </div>
               ))}
          </div>

          {/* LAPTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Thông tin đăng nhập</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Họ và tên</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vai trò / Nhiệm vụ</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                        <div className="flex flex-col items-center opacity-20">
                            <Layers className="w-20 h-20 mb-6 stroke-[1.5]" />
                            <p className="text-sm font-black uppercase tracking-[0.3em]">Danh sách nhân sự trống</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all group">
                      <td className="py-6 px-10">
                           <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic shadow-sm group-hover:scale-110 transition-transform ${e.role === 'Admin' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    {e.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                     <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{e.username}</p>
                                     <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest italic opacity-60 flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> ID: #{e.id}</span>
                                </div>
                           </div>
                      </td>
                      <td className="py-6 px-10">
                           <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">{e.fullName}</span>
                      </td>
                      <td className="py-6 px-10">
                           <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    e.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                }`}>
                                     {e.role}
                                </span>
                                {e.role === 'Staff' && <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic flex items-center gap-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"><Briefcase className="w-3 h-3" /> Nhân viên quầy</span>}
                           </div>
                      </td>
                      <td className="py-6 px-10 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button
                            className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all flex items-center justify-center active:scale-90"
                            onClick={() => { setShowForm(true); setEditingEmployee(e); }}
                            disabled={formLoading}
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center active:scale-90"
                            onClick={() => handleDelete(e.id)}
                            disabled={formLoading}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                  {editingEmployee ? "Cập nhật nhân viên" : "Tạo mã nhân viên mới"}
                </h2>
                <button onClick={() => setShowForm(false)} className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all shadow-sm">
                    <X className="w-5 h-5" />
                </button>
              </div>
            <div className="p-8">
              <EmployeeForm
                employee={editingEmployee}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingEmployee(undefined); }}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
