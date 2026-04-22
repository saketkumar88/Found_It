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

  // Sync user
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

  // Listen for incoming messages
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
      <div className="relative min-h-screen bg-black text-white">

        {userEmail && (
          <>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="fixed top-6 right-6 z-[60] p-3 bg-cyan-500/20 border border-cyan-500/50 rounded-full"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] px-2 py-0.5 rounded-full">
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
                className="p-4 bg-cyan-600 rounded-full"
              >
                💬
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] h-5 w-5 flex items-center justify-center rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </>
        )}

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

        <Routes>
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/login" element={<PublicRoute><LoginSignup /></PublicRoute>} />
          <Route path="/report-found" element={<PrivateRoute><FormPage type="found" /></PrivateRoute>} />
          <Route path="/report-lost" element={<PrivateRoute><FormPage type="lost" /></PrivateRoute>} />
          
          {/* ✅ UPDATED ROUTES: Optional itemId path parameter add kiya hai */}
          <Route path="/view-lost/:itemId?" element={<PrivateRoute><LostItems /></PrivateRoute>} />
          <Route path="/view-found/:itemId?" element={<PrivateRoute><FoundItems /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;