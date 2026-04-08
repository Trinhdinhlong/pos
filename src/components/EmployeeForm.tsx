import React from "react";

export interface Employee {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: Omit<Employee, "id"> & { passwordHash?: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function EmployeeForm({ employee, onSubmit, onCancel, loading }: EmployeeFormProps) {
  const [username, setUsername] = React.useState(employee?.username || "");
  const [fullName, setFullName] = React.useState(employee?.fullName || "");
  // Khi thêm mới: role luôn là Staff, không cho chọn; khi sửa: cho xem nhưng không cho sửa nếu là Staff
  const [role, setRole] = React.useState(employee?.role || "Staff");
  const [password, setPassword] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName) return;
    // Khi thêm mới: luôn gửi role: "Staff"; khi sửa: giữ nguyên role
    // Luôn gửi đủ các trường, password là rỗng nếu không đổi
    onSubmit({
      username,
      fullName,
      role: employee ? role : "Staff",
      passwordHash: password || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Tên đăng nhập</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          disabled={!!employee}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Họ tên</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
        />
      </div>
      {/* Khi sửa mới hiển thị trường role, và nếu là Staff thì không cho sửa */}
      {employee && (
        <div>
          <label className="block mb-1 font-medium">Vai trò</label>
          <input
            className="w-full border rounded px-3 py-2 bg-gray-100"
            value={role}
            disabled
          />
        </div>
      )}
      <div>
        <label className="block mb-1 font-medium">Mật khẩu {employee ? '(để trống nếu không đổi)' : ''}</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={employee ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
          required={!employee}
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {employee ? "Cập nhật" : "Thêm mới"}
        </button>
        <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
      </div>
    </form>
  );
}
