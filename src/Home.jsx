import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const collegeId = localStorage.getItem("collegeId");

    if (!token) {
      navigate("/login");
    } else {
      setUser(collegeId);
    }
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("collegeId");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans">
      {/* --- FULL WIDTH SLIM NAVBAR --- */}
      {/* Removed max-w and mx-auto. Kept py-2 for thinness. */}
      <nav className="w-full flex justify-between items-center px-8 py-4 border-b border-white/10 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Small L Logo */}
          <div className="w-7 h-7 bg-cyan-500 rounded flex items-center justify-center font-bold text-black text-sm">
            L
          </div>
          <h1 className="text-lg font-bold tracking-tight">LOST & FOUND</h1>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-base hidden md:block">
            Welcome, <span className="text-cyan-400 font-semibold">{user}</span>
          </span>
          <button
            onClick={handleSignOut}
            className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h2 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Recover What's Yours.
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The central hub for our college community to report lost items and return found ones safely and securely.
          </p>
        </header>

        {/* Action Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 border border-white/5 p-8 rounded-3xl hover:border-cyan-500/50 transition-all group cursor-pointer" onClick={() => navigate("/report")}>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">I Found Something</h3>
            <p className="text-gray-400 mb-6">Found an item on campus? Post it here so the owner can claim it.</p>
            <button className="text-cyan-400 font-semibold flex items-center gap-2 text-sm">
              Start Report <span>→</span>
            </button>
          </div>

          <div className="bg-gray-900 border border-white/5 p-8 rounded-3xl hover:border-blue-500/50 transition-all group cursor-pointer" onClick={() => navigate("/lost")}>
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🎒</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">I Lost Something</h3>
            <p className="text-gray-400 mb-6">Looking for your lost belongings? Check the listings or post a request.</p>
            <button className="text-blue-400 font-semibold flex items-center gap-2 text-sm">
              Search Items <span>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;