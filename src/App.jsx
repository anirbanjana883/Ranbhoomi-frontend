import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';

// Custom Hooks & Utils
import useGetCurrentUser from "./customHooks/useGetCurrentUser";
import ScrollToTop from './component/ScrollToTop';

// Components
import Nav from './component/Nav';
import MasterRoute from './component/adminComponents/MasterRoute';
import AdminRoute from './component/adminComponents/AdminRoute';
import PricingSection from './component/PricingSection';

// Pages
import Home from './pages/Home';
import SignUp from './pages/authenticationPages/SignUp';
import Login from './pages/authenticationPages/Login';
import ForgetPassowrd from './pages/authenticationPages/ForgetPassword';
import ProfilePage from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
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
import ContestRankingPage from './pages/contestPages/ContestRankingPage';
import InterviewLobby from './pages/interviewPages/InterviewLobby';
import InterviewRoom from './pages/interviewPages/InterviewRoom';
import RoadmapListPage from './pages/roadmapPages/RoadmapListPage';
import RoadmapDetailsPage from './pages/roadmapPages/RoadmapDetailsPage';
import CreatePrivateContest from './pages/premiumUser/CreatePrivateContest';
import EditPrivateContest from './pages/premiumUser/EditPrivateContest';
import Community from './pages/Community/Community';

export const serverUrl = "http://localhost:5000";

function App() {
  useGetCurrentUser();
  const { userData, loading } = useSelector(state => state.user);
  const location = useLocation();

  // Strict UI Requirement: Nav is ONLY visible on the Home page ('/')
  const isHomePage = location.pathname === '/';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin mb-4" />
        <h2 className="text-zinc-400 font-mono text-sm tracking-widest uppercase animate-pulse">
          Initializing Ranbhoomi...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 selection:bg-red-500/30 selection:text-red-200">
      {/* Conditionally render Nav only on Home */}
      {isHomePage && <Nav />}

      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#18181b', // zinc-900
            color: '#f4f4f5',      // zinc-100
            border: '1px solid #27272a', // zinc-800
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '6px',
            padding: '12px 24px',
            boxShadow: 'none',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#18181b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#18181b',
            },
          },
        }}
      />
      
      <ToastContainer theme="dark" toastStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
      <ScrollToTop />

      <main className="relative">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/signup' element={!userData ? <SignUp/> : <Navigate to={"/"}/>}/>
          <Route path='/login' element={!userData ? <Login /> : <Navigate to={"/"} />} />
          <Route path='/forget' element={!userData ? <ForgetPassowrd/> : <Navigate to="/"/>}/>
          
          {/* Protected Profile Routes */}
          <Route path='/profile/:username' element={userData ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path='/editprofile' element={userData ? <EditProfile /> : <Navigate to="/login" />} />

          {/* Practice & Problem Routes */}
          <Route path='/practice' element={userData ? <ProblemListPage /> : <Navigate to="/login" />} /> 
          <Route path='/problem/:slug' element={userData ? <ProblemPage /> : <Navigate to="/login" />} />

          {/* Master Admin Routes */}
          <Route element={<MasterRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Standard Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/problems" element={<ProblemManagementPage />} />
            <Route path="/admin/problems/create" element={<CreateProblemPage />} /> 
            <Route path="/admin/problems/edit/:slug" element={<EditProblemPage />} /> 
            <Route path="/admin/contests" element={<AdminContestPage />} />
            <Route path="/admin/contests/create" element={<CreateContestPage />} />
            <Route path="/admin/contests/edit/:slug" element={<EditContestPage />} />
          </Route> 

          {/* Contest System */}
          <Route path='/contests' element={userData ? <ContestListPage /> : <Navigate to="/login" />} />
          <Route path='/contest/:slug' element={userData ? <ContestDetailsPage /> : <Navigate to="/login" />} />
          <Route path='/contest/:slug/problem/:problemSlug' element={userData ? <ContestInterface /> : <Navigate to="/login" />} />
          <Route path='/contest/:slug/ranking' element={userData ? <ContestRankingPage /> : <Navigate to="/login" />} />
          <Route path="/contest/create-private" element={<CreatePrivateContest />} /> 
          <Route path="/contest/edit-private/:slug" element={<EditPrivateContest />} />

          {/* Interview System */}
          <Route path='/interview' element={userData ? <InterviewLobby /> : <Navigate to="/login" />} />
          <Route path='/interview/:roomID' element={userData ? <InterviewRoom /> : <Navigate to="/login" />} />
          
          {/* Education System */}
          <Route path='/roadmaps' element={userData ? <RoadmapListPage /> : <Navigate to="/login" />} />
          <Route path='/roadmap/:roadmapId' element={userData ? <RoadmapDetailsPage /> : <Navigate to="/login" />} /> 

          {/* Monetization & Community */}
          <Route path='/premium' element={<PricingSection />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;