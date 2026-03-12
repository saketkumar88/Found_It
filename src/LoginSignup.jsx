import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginSignup() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? "/login" : "/signup";
    
    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, password }),
      });
      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("token", data.token); 
          localStorage.setItem("collegeId", collegeId);
          navigate("/"); 
        } else {
          alert("Success! Please login.");
          setIsLogin(true);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* --- UPDATED GRADIENT HEADING --- */}
      <h1 className="text-7xl md:text-8xl font-black mb-12 tracking-tighter 
                     bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 
                     bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,197,253,0.3)] 
                     animate-slideDown">
        FOUND-IT
      </h1>

      <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/10 animate-fadeUp">
        {/* --- OPTIONAL: Subtle blue gradient on the form title too --- */}
        <h2 className="text-2xl font-bold bg-gradient-to-br from-white to-cyan-400 bg-clip-text text-transparent mb-6">
          {isLogin ? "Login" : "Sign Up"}
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleAuth}>
          <input
            type="text"
            placeholder="College ID"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-cyan-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-cyan-500 transition-all"
            required
          />
          <button className="bg-white text-black py-3 rounded-xl font-bold mt-2 hover:bg-gray-200 transition active:scale-95">
            {loading ? "..." : (isLogin ? "Sign In" : "Register")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? "New user?" : "Have an account?"}{" "}
          <span className="text-white font-bold cursor-pointer underline hover:text-cyan-400 transition-colors" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginSignup;
