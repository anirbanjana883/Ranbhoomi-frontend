import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';
import getCurrentUser from './customHooks/getCurrentUser';
import { useSelector } from 'react-redux';
import ScrollToTop from './component/ScrollToTop';
import ForgetPassowrd from './pages/ForgetPassword';
import ProfilePage from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import MasterRoute from './component/MasterRoute';
import AdminRoute from './component/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import Nav from './component/Nav';
import ProblemPage from './pages/ProblemPage';
import ProblemListPage from './pages/ProblemListPage';

import CreateProblemPage from './pages/Admin/CreateProblemPage';
import EditProblemPage from './pages/Admin/EditProblemPage';
import ProblemManagementPage from './pages/Admin/ProblemManagementPage';

export const serverUrl = "http://localhost:8000";

function App() {
  getCurrentUser();
  const { userData } = useSelector(state => state.user);
  
  const location = useLocation();

  const hideNavPaths = ['/login', '/signup', '/forget'];

  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <>
      {/* Conditionally render the Nav */}
      {showNav && <Nav />}

      <ToastContainer />
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
        <Route path='/login' element={!userData ? <Login /> : <Navigate to={"/"} />} />
        <Route path='/forget' element={!userData ? <ForgetPassowrd /> : <Navigate to="/" />} />
        <Route path='/profile/:username' element={userData ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path='/editprofile' element={userData ? <EditProfile /> : <Navigate to="/login" />} />

        {/* practice problem */}
        <Route path='/practice' element={userData ? <ProblemListPage /> : <Navigate to="/login" />} />    
        <Route path='/problem/:slug' element={userData ? <ProblemPage /> : <Navigate to="/login" />} />


        {/* role based suth control system */}
        <Route element={<MasterRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/problems" element={<ProblemManagementPage />} />
          <Route path="/admin/problems/create" element={<CreateProblemPage />} /> 
          <Route path="/admin/problems/edit/:slug" element={<EditProblemPage />} /> 
        </Route>


      </Routes>
    </>
  );
}

export default App;