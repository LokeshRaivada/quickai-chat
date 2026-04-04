import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Interview from './pages/Interview';
import ConceptExplainer from './pages/ConceptExplainer';
import StudyPlanner from './pages/StudyPlanner';
import History from './pages/History';
import Home from './pages/Home';
import FloatingChat from './components/FloatingChat';
import { Toaster } from 'react-hot-toast';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setLoggedIn(true);
    }
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) return null;

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <Routes>
        {/* Landing Page Route */}
        <Route path="/" element={<Home loggedIn={loggedIn} user={user} setLoggedIn={setLoggedIn} setUser={setUser} />} />

        {/* Secure Application Routes */}
        <Route path="/*" element={
          loggedIn ? (
            <div className="flex bg-[#0B1120] text-slate-100 min-h-screen selection:bg-indigo-500/30 selection:text-white">
              <Sidebar user={user} setLoggedIn={setLoggedIn} />
              <main className="flex-1 ml-[280px] p-8 lg:p-12 min-h-screen relative">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/concept" element={<ConceptExplainer />} />
                  <Route path="/study-planner" element={<StudyPlanner />} />
                  <Route path="/history" element={<History />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
                <FloatingChat />
              </main>
            </div>
          ) : (
            <Navigate to="/" />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
