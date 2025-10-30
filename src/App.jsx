import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/authenticationPages/SignUp';
import Login from './pages/authenticationPages/Login';
import { ToastContainer } from 'react-toastify';
import getCurrentUser from './customHooks/getCurrentUser';
import { useSelector } from 'react-redux';
import ScrollToTop from './component/ScrollToTop';
import ForgetPassowrd from './pages/authenticationPages/ForgetPassword';
import ProfilePage from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import MasterRoute from './component/adminComponents/MasterRoute';
import AdminRoute from './component/adminComponents/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import Nav from './component/Nav';
import ProblemPage from './pages/problemPages/ProblemPage';
import ProblemListPage from './pages/problemPages/ProblemListPage';

import CreateProblemPage from './pages/Admin/CreateProblemPage';
import EditProblemPage from './pages/Admin/EditProblemPage';
import ProblemManagementPage from './pages/Admin/ProblemManagementPage';
import ContestListPage from './pages/contestPages/ContestListPage';
import ContestDetailsPage from './pages/contestPages/ContestDetailsPage';
import ContestInterface from './pages/contestPages/ContestInterface';
import CreateContestPage from './pages/Admin/CreateContestPage';
import AdminContestPage from './pages/Admin/AdminContestPage';
import EditContestPage from './pages/Admin/EditContestPage';

export const serverUrl = "http://localhost:8000";

function App() {
  getCurrentUser();
  const { userData } = useSelector(state => state.user);
  
  const location = useLocation();

  const hideNavPaths = ['/login', '/signup', '/forget' ,];
  const showNav = !hideNavPaths.includes(location.pathname) && !location.pathname.startsWith('/problem/');


  return (
    <>
      {/* Conditionally render the Nav */}
      {showNav && <Nav />}

      <ToastContainer />
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/signup' element={!userData ? <SignUp/> : <Navigate to={"/"}/>}/>
        <Route path='/login' element={!userData ? <Login /> : <Navigate to={"/"} />} />
        <Route path='/forget' element={!userData ? <ForgetPassowrd/> : <Navigate to="/"/>}/>
        <Route path='/profile/:username' element={userData ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path='/editprofile' element={userData ? <EditProfile /> : <Navigate to="/login" />} />

        {/* practice problem */}
        <Route path='/practice' element={userData ? <ProblemListPage /> : <Navigate to="/login" />} />    
        <Route path='/problem/:slug' element={userData ? <ProblemPage /> : <Navigate to="/login" />} />


        {/* role based auth control system */}
        <Route element={<MasterRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* --- Admin & Master Routes --- */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/problems" element={<ProblemManagementPage />} />
          <Route path="/admin/problems/create" element={<CreateProblemPage />} /> 
          <Route path="/admin/problems/edit/:slug" element={<EditProblemPage />} /> 

          {/* --- MOVE THESE ROUTES INSIDE --- */}
          <Route path="/admin/contests" element={<AdminContestPage />} />
          <Route path="/admin/contests/create" element={<CreateContestPage />} />
          <Route path="/admin/contests/edit/:slug" element={<EditContestPage />} />
        </Route> 


        {/* --- User-facing Contest Routes --- */}
        <Route path='/contests' element={userData ? <ContestListPage /> : <Navigate to="/login" />} />
        <Route path='/contest/:slug' element={userData ? <ContestDetailsPage /> : <Navigate to="/login" />} />
        <Route path='/contest/:slug/problem/:problemSlug' element={userData ? <ContestInterface /> : <Navigate to="/login" />} />

        {/* --- DELETE THE STRAY ROUTES FROM HERE --- */}
      </Routes>
    </>
  );
}

export default App;