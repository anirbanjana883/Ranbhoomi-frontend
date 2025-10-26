import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {

  const { userData, loading } = useSelector((state) => state.user);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                        [box-shadow:0_0_25px_rgba(255,69,0,0.6)]"></div>
      </div>
    );
  }

  if (userData && (userData.role === 'admin' || userData.role === 'master')) {
    return <Outlet />; 
  }

  if (userData) {
      return <Navigate to={`/profile/${userData.username}`} replace />;
  } else {
      return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;