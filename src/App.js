import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import LoginSignup from './LoginSignup';
import FormPage from './FormPage'; // Import the new FormPage component

// --- Private Route Guard ---
// Ensures only logged-in users can access the dashboard or forms
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

// --- Public Route Guard ---
// Redirects logged-in users away from the login page
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return !token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      {/* Master Container */}
      <div className="relative min-h-screen w-full bg-black overflow-hidden selection:bg-cyan-500/30">
        
        {/* --- LAYER 1: GLOBAL BUBBLE BACKGROUND --- */}
        {/* This layer stays static while the content changes, keeping animations smooth */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]"></div>
          
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="bubble bg-white/10 blur-[1px]"
              style={{ 
                left: `${Math.random() * 100}%`, 
                width: `${Math.random() * 50 + 20}px`,
                height: `${Math.random() * 50 + 20}px`,
                animationDuration: `${Math.random() * 10 + 10}s`, 
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* --- LAYER 2: APP CONTENT --- */}
        <div className="relative z-10 w-full h-full">
          <Routes>
            {/* Home Route */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } 
            />

            {/* Login/Signup Route */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginSignup />
                </PublicRoute>
              } 
            />

            {/* --- FORM ROUTES --- */}
            {/* We pass the 'type' prop to FormPage to distinguish between Lost and Found */}
            <Route 
              path="/report" 
              element={
                <PrivateRoute>
                  <FormPage type="found" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/lost" 
              element={
                <PrivateRoute>
                  <FormPage type="lost" />
                </PrivateRoute>
              } 
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;