import { toast } from "react-hot-toast";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Menu,
  Trash2,
  CheckSquare,
  Square,
  X,
  Mail,
  Cake,
  Calendar,
  Trophy,
  Flame,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import ProfileModal from "../components/ProfileModal";
import {
  fetchAllUsers,
  fetchUserById,
  deleteUserById,
} from "../utils/services/adminUserService";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllUsers();
        const list = Array.isArray(data)
          ? data
          : (data?.items ?? data?.data ?? []);
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          const userRoleOnlyList = list.filter(
            (u) => String(u.role ?? "USER").toUpperCase() === "USER",
          );
          const mapped = userRoleOnlyList.map((u) => ({
            id: String(u.id ?? u.userId ?? ""),
            username: u.username ?? u.userName ?? u.name ?? "",
            fullName: u.fullName ?? u.full_name ?? u.name ?? "",
            email: u.email ?? "",
            date_of_birth:
              u.date_of_birth ?? u.dateOfBirth ?? u.dob ?? "2000-01-01",
            joinDate: u.joinDate ?? u.join_date ?? "01/01/2026",
            streak: u.currentStreak ?? u.streak ?? u.bestStreak ?? 0,
            totalXP: u.totalScore ?? u.totalXP ?? u.score ?? 0,
            avatarChar: (u.fullName ?? u.username ?? "U")
              .slice(0, 1)
              .toUpperCase(),
            avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
          }));
          setUsers(mapped);
        }
      } catch {
        
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(null);
  const itemsPerPage = 10;

  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  
  const processedUsers = useMemo(() => {
    let result = users;

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch) ||
          user.fullName.toLowerCase().includes(lowerSearch),
      );
    }

    
    if (sortOrder) {
      result = [...result].sort((a, b) => {
        const nameA = a.username.toLowerCase();
        const nameB = b.username.toLowerCase();
        if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
        if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, sortOrder]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage) || 1;

  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [processedUsers, currentPage]);

  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleSort = (order) => {
    if (sortOrder === order) {
      setSortOrder(null);
    } else {
      setSortOrder(order);
    }
    setCurrentPage(1);
  };

  const handleOpenProfile = async (user) => {
    setSelectedProfileUser(user);
    setIsProfileModalOpen(true);
    try {
      const detail = await fetchUserById(user.id);
      if (detail) {
        const mapped = {
          ...user,
          id: String(detail.userId ?? user.id),
          username: detail.username ?? user.username,
          fullName: detail.fullName ?? user.fullName,
          email: detail.email ?? user.email,
          date_of_birth: detail.date_of_birth ?? user.date_of_birth,
          joinDate: detail.createdAt ?? user.joinDate,
          streak: detail.currentStreak ?? user.streak,
          totalXP: detail.totalScore ?? user.totalXP,
          avatarUrl: detail.avatarUrl ?? user.avatarUrl,
        };
        setSelectedProfileUser(mapped);
      }
    } catch {
      
    }
  };

  const handleDeleteClick = (user = null) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const targetUser = userToDelete;
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    try {
      if (targetUser) {
        await deleteUserById(targetUser.id);
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        toast.success(`Đã xóa tài khoản "${targetUser.fullName || targetUser.username}" thành công.`);
        
        setUsers((prev) => {
          const newTotal = prev.length;
          const newTotalPages = Math.ceil(newTotal / itemsPerPage) || 1;
          if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
          return prev;
        });
      }
    } catch {
      toast.error('Xóa user thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Quản lý User</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Danh sách người dùng hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">

          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm tài khoản, email..."
            className="w-full sm:w-72"
          />
        </div>
      </div>


      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {isLoading && (
          <div className="px-6 py-4 text-sm font-bold text-slate-400 border-b border-slate-100">
            Đang tải danh sách user...
          </div>
        )}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-sm uppercase tracking-wider">
                <th className="py-4 px-6 w-16 text-center">STT</th>
                <th className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    Người dùng
                    <div className="flex flex-col">
                      <button
                        onClick={() => toggleSort("asc")}
                        className={`p-0.5 rounded transition-colors ${sortOrder === "asc" ? "text-cyan-600 bg-cyan-50" : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"}`}
                        title="Sắp xếp A-Z"
                      >
                        <ArrowUp size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => toggleSort("desc")}
                        className={`p-0.5 rounded -mt-0.5 transition-colors ${sortOrder === "desc" ? "text-cyan-600 bg-cyan-50" : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"}`}
                        title="Sắp xếp Z-A"
                      >
                        <ArrowDown size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </th>
                <th className="py-4 px-6 w-24 text-center">Profile</th>
                <th className="py-4 px-6 w-24 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => {
                  const stt = index + 1 + (currentPage - 1) * itemsPerPage;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-6 text-center text-slate-500 font-bold">
                        {stt}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#0e7490] text-white flex items-center justify-center font-bold shadow-sm shrink-0 overflow-hidden border-2 border-white">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.avatarChar
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base">
                              {user.fullName || user.username}
                            </p>
                            <p className="text-sm text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenProfile(user)}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors mx-auto block"
                          title="Xem hồ sơ"
                        >
                          <Menu size={20} />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors mx-auto block"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="tài khoản"
          showPageNumbers={true}
        />
      </div>


      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={
          selectedProfileUser
            ? {
                ...selectedProfileUser,
                xp: selectedProfileUser.totalXP,
                join_date: selectedProfileUser.joinDate,
                date_of_birth: selectedProfileUser.date_of_birth
                  .split("-")
                  .reverse()
                  .join("/"),
              }
            : null
        }
        isEditable={false}
      />


      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete?.fullName || userToDelete?.username}" không? Hành động này không thể hoàn tác.`}
        isDanger={true}
      />
    </div>
  );
}