import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const MasterRoute = () => {
  const { userData, loading } = useSelector((state) => state.user);

  if (loading) {
    // Show a loading spinner while user data is being fetched
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-24 h-24 border-8 border-t-transparent border-orange-600 rounded-full animate-spin
                        [box-shadow:0_0_30px_rgba(255,69,0,0.7)]"></div>
      </div>
    );
  }

  // Check if user is loaded and if their role is 'master'
  if (userData && userData.role === 'master') {
    return <Outlet />; // Show the child route (AdminDashboard)
  } 
  
  // If not master, send them away
  return <Navigate to="/" replace />;
};

export default MasterRoute;