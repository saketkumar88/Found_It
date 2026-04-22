import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Home from './Home';
import LoginSignup from './LoginSignup';
import FormPage from './FormPage';
import LostItems from './LostItems';
import FoundItems from './FoundItems';
import NotificationSidebar from './NotificationSidebar';
import ChatModal from './ChatModal';

import socket from './socket';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return !token ? children : <Navigate to="/" />;
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [unreadMessages, setUnreadMessages] = useState(0); 
  const [chatConfig, setChatConfig] = useState({ isOpen: false, targetUser: null });
  
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("collegeEmailId") || localStorage.getItem("collegeId") || localStorage.getItem("email")
  );

  // Sync user state
  useEffect(() => {
    const interval = setInterval(() => {
      const activeUser =
        localStorage.getItem("collegeEmailId") ||
        localStorage.getItem("collegeId") ||
        localStorage.getItem("email");

      if (activeUser !== userEmail) {
        setUserEmail(activeUser);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userEmail]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`http://localhost:8080/api/notifications/${userEmail}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error("Notif Error:", err);
    }
  }, [userEmail]);

  // Socket Message Listener
  useEffect(() => {
    if (!userEmail) return;

    const handleNewMsg = (data) => {
      if (!chatConfig.isOpen || chatConfig.targetUser !== data.senderId) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    socket.on('receive_message', handleNewMsg);
    return () => socket.off('receive_message', handleNewMsg);
  }, [chatConfig, userEmail]);

  const handleOpenChat = (target) => {
    if (!target) return;
    setChatConfig({
      isOpen: true,
      targetUser: target
    });
    setIsSidebarOpen(false);
    setUnreadMessages(0);
  };

  useEffect(() => {
    if (userEmail) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, userEmail]);

  return (
    <Router>
      {/* Main Wrapper - Uses your specific midnight blue base */}
      <div className="relative min-h-screen bg-[#020617] text-white overflow-x-hidden">
        
        {/* --- GLOBAL HYPER-FANCY ANIMATED BACKGROUND (Transferred from Home.jsx) --- */}
        <div className="fixed-bg">
          
          {/* 1. Animated Aurora/Nebula Clouds */}
          <div className="aurora-cyan"></div>
          <div className="aurora-blue"></div>
          <div className="aurora-purple"></div>

          {/* 2. 3D Perspective Vanishing Grid */}
          <div className="grid-overlay"></div>

          {/* 3. Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="star-particle"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 10 + 10 + 's'
              }}
            />
          ))}
        </div>

        {/* --- UI FIXED ELEMENTS --- */}
        {userEmail && (
          <>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="fixed top-6 right-6 z-[60] p-3 bg-cyan-500/20 border border-cyan-500/50 rounded-full backdrop-blur-md hover:bg-cyan-500/40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="fixed bottom-6 right-6 z-[60]">
              <button 
                onClick={() => {
                  if (chatConfig.targetUser) {
                    setChatConfig(prev => ({ ...prev, isOpen: !prev.isOpen }));
                    setUnreadMessages(0);
                  } else {
                    setIsSidebarOpen(true);
                  }
                }}
                className="p-4 bg-cyan-600 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-110 transition-transform"
              >
                💬
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#020617]">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </>
        )}

        {/* --- MODALS & SIDEBARS --- */}
        <NotificationSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userEmail={userEmail}
          notifications={notifications}
          refreshCount={fetchNotifications}
          onOpenChat={handleOpenChat}
        />

        <ChatModal 
          isOpen={chatConfig.isOpen}
          onClose={() => setChatConfig(prev => ({ ...prev, isOpen: false }))}
          currentUser={userEmail}
          targetUser={chatConfig.targetUser}
        />

        {/* --- ROUTES WRAPPER --- */}
        {/* Added bg-transparent-force to ensure visibility of background */}
        <div className="relative z-10 bg-transparent-force">
          <Routes>
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/login" element={<PublicRoute><LoginSignup /></PublicRoute>} />
            <Route path="/report-found" element={<PrivateRoute><FormPage type="found" /></PrivateRoute>} />
            <Route path="/report-lost" element={<PrivateRoute><FormPage type="lost" /></PrivateRoute>} />
            <Route path="/view-lost/:itemId?" element={<PrivateRoute><LostItems /></PrivateRoute>} />
            <Route path="/view-found/:itemId?" element={<PrivateRoute><FoundItems /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;