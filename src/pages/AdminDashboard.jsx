import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import {
  FaCheck,
  FaTimes,
  FaUserShield,
  FaUserEdit,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Loading spinner (already themed)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div
      className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                    [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"
    ></div>
  </div>
);

// Tab Component (Refined styles)
const Tab = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    // Reduced text size, adjusted glow
    className={`px-5 py-2.5 text-base font-bold transition-all duration-300 border-b-2
                   ${
                     isActive
                       ? "border-orange-500 text-orange-400 [text-shadow:0_0_12px_rgba(255,69,0,0.5)]"
                       : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700/50" // Softer hover border
                   }`}
  >
    {label}
  </button>
);

// Main Dashboard Component
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();

  // --- Fetch Data ---
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const { data } = await axios.get(
        `${serverUrl}/api/admin/requests/pending`,
        { withCredentials: true }
      );
      setRequests(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch requests.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data } = await axios.get(`${serverUrl}/api/admin/users`, {
        withCredentials: true,
      });
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // --- Action Handlers ---
  const handleReviewRequest = async (requestId, action) => {
    try {
      await axios.patch(
        `${serverUrl}/api/admin/requests/${action}/${requestId}`,
        {},
        { withCredentials: true }
      );
      toast.success(`Request ${action}d successfully.`);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Review failed.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await axios.patch(
        `${serverUrl}/api/admin/users/role/${userId}`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success(data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Role update failed.");
    }
  };

  const isLoading =
    (activeTab === "requests" && loadingRequests) ||
    (activeTab === "users" && loadingUsers);

  return (
    <>
      <button
        onClick={() => navigate(-1)} 
        
        className="fixed top-[5.5rem] left-4 sm:left-6 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-md
                           border border-orange-600/30 shadow-[0_0_20px_rgba(255,69,0,0.2)]
                           text-orange-500 font-bold rounded-full py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm
                           transition-all duration-300 transform
                           hover:border-orange-600/70 hover:shadow-[0_0_35px_rgba(255,69,0,0.4)]
                           hover:text-orange-400 hover:scale-105"
      >
        <FaArrowLeft />
        <span className="hidden sm:inline">Back</span>{" "}
        {/* Hide text on small screens */}
      </button>
      <div className="min-h-screen bg-black text-gray-300 pt-28 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-4xl font-bold text-white mb-6 // Reduced size
                               [text-shadow:0_0_12px_rgba(255,255,255,0.3),0_0_25px_rgba(255,69,0,0.6)]"
          >
            {" "}
            {/* Adjusted glow */}
            Master Dashboard
          </h1>

          {/* --- Tabs --- */}
          <div className="mb-6 border-b border-gray-800">
            {" "}
            {/* Reduced mb */}
            <Tab
              label="Admin Requests"
              isActive={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
            />
            <Tab
              label="Manage Users"
              isActive={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            />
          </div>

          {/* --- Content Area --- */}
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            // Card container with refined glow
            <div
              className="bg-black border border-orange-600/30
                                    shadow-[0_0_20px_rgba(255,69,0,0.2)]
                                    hover:border-orange-600/50 hover:shadow-[0_0_35px_rgba(255,69,0,0.3)] // Subtler hover glow
                                    rounded-xl overflow-hidden transition-all duration-300"
            >
              {" "}
              {/* Changed rounded */}
              {activeTab === "requests" && (
                <AdminRequestsTable
                  requests={requests}
                  onReview={handleReviewRequest}
                />
              )}
              {activeTab === "users" && (
                <UsersTable users={users} onRoleChange={handleRoleChange} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// --- Sub-component for Admin Requests Table ---
const AdminRequestsTable = ({ requests, onReview }) => {
  if (requests.length === 0) {
    return (
      <p className="p-6 text-xl text-gray-500 text-center">
        There are no pending requests.
      </p>
    ); // Reduced size/padding
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="border-b border-orange-600/30 bg-black/20">
            {" "}
            {/* Slightly less opaque bg */}
            <tr>
              {/* Reduced text size, adjusted glow */}
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)]">
                User
              </th>
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)]">
                Reason
              </th>
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)] text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr
                key={req._id}
                className="border-t border-orange-600/20 hover:bg-orange-900/10 transition-colors"
              >
                <td className="p-3 flex items-center gap-2.5">
                  {" "}
                  {/* Reduced padding/gap */}
                  <img
                    src={
                      req.userId?.photoUrl ||
                      `https://api.dicebear.com/8.x/lorelei/svg?seed=${
                        req.userId?.username || "default"
                      }`
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-orange-700/50"
                  />{" "}
                  {/* Reduced size */}
                  <div>
                    <p className="text-white font-medium text-sm">
                      {req.userId?.name || "User Deleted"}
                    </p>{" "}
                    {/* Reduced size */}
                    <p className="text-xs text-gray-400">{req.email}</p>{" "}
                    {/* Reduced size */}
                  </div>
                </td>
                <td
                  className="p-3 max-w-md truncate text-gray-400 text-sm"
                  title={req.reason}
                >
                  {" "}
                  {/* Reduced size */}
                  {req.reason}
                </td>
                <td className="p-3 flex justify-center gap-2">
                  {" "}
                  {/* Reduced gap */}
                  {/* Adjusted button styles */}
                  <button
                    onClick={() => onReview(req._id, "approve")}
                    className="p-1.5 bg-green-600/20 text-green-400 rounded-md border border-green-600/50 shadow-[0_0_10px_rgba(0,255,0,0.2)] hover:bg-green-600/40 hover:text-white hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] transition-all transform hover:scale-110"
                    title="Approve"
                  >
                    <FaCheck size={16} />
                  </button>
                  <button
                    onClick={() => onReview(req._id, "reject")}
                    className="p-1.5 bg-red-600/20 text-red-400 rounded-md border border-red-600/50 shadow-[0_0_10px_rgba(255,0,0,0.2)] hover:bg-red-600/40 hover:text-white hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all transform hover:scale-110"
                    title="Reject"
                  >
                    <FaTimes size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// --- Sub-component for Users Table ---
const UsersTable = ({ users, onRoleChange }) => {
  if (users.length === 0) {
    return (
      <p className="p-6 text-xl text-gray-500 text-center">No users found.</p>
    ); // Reduced size/padding
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="border-b border-orange-600/30 bg-black/20">
            {" "}
            {/* Slightly less opaque bg */}
            <tr>
              {/* Reduced text size, adjusted glow */}
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)]">
                User
              </th>
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)]">
                Email
              </th>
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)] text-center">
                Current Role
              </th>
              <th className="p-3 text-base text-orange-400 [text-shadow:0_0_8px_rgba(255,69,0,0.4)] text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-t border-orange-600/20 hover:bg-orange-900/10 transition-colors"
              >
                <td className="p-3 flex items-center gap-2.5">
                  {" "}
                  {/* Reduced padding/gap */}
                  <img
                    src={
                      user.photoUrl ||
                      `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-orange-700/50"
                  />{" "}
                  {/* Reduced size */}
                  <div>
                    <p className="text-white font-medium text-sm">
                      {user.name}
                    </p>{" "}
                    {/* Reduced size */}
                    <p className="text-xs text-gray-400">
                      @{user.username}
                    </p>{" "}
                    {/* Reduced size */}
                  </div>
                </td>
                <td className="p-3 text-gray-400 text-sm">{user.email}</td>{" "}
                {/* Reduced size */}
                <td className="p-3 text-center">
                  {/* Adjusted badge styles */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-green-500/20 text-green-300 shadow-[0_0_8px_rgba(0,255,0,0.2)]"
                        : "bg-gray-700/50 text-gray-400"
                    }`}
                  >
                    {user.role === "admin" ? <FaUserShield /> : <FaUserEdit />}
                    {user.role === "admin" ? "Admin" : "User"}
                  </span>
                </td>
                <td className="p-3 text-center space-x-2">
                  {/* Adjusted button styles */}
                  {user.role === "user" ? (
                    <button
                      onClick={() => onRoleChange(user._id, "admin")}
                      className="px-2.5 py-1 bg-green-600/20 text-green-400 rounded text-xs border border-green-600/50 shadow-[0_0_8px_rgba(0,255,0,0.2)] hover:bg-green-600/40 hover:text-white hover:shadow-[0_0_12px_rgba(0,255,0,0.3)] transition-all transform hover:scale-105"
                      title="Promote to Admin"
                    >
                      Make Admin
                    </button>
                  ) : (
                    // user.role === 'admin'
                    <button
                      onClick={() => onRoleChange(user._id, "user")}
                      className="px-2.5 py-1 bg-red-600/20 text-red-400 rounded text-xs border border-red-600/50 shadow-[0_0_8px_rgba(255,0,0,0.2)] hover:bg-red-600/40 hover:text-white hover:shadow-[0_0_12px_rgba(255,0,0,0.3)] transition-all transform hover:scale-105"
                      title="Demote to User"
                    >
                      Remove Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminDashboard;
