import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function FormPage({ type }) {
  const navigate = useNavigate();
  const title = type === "found" ? "Report Found Item" : "Report Lost Item";
  const themeColor = type === "found" ? "border-cyan-500/50" : "border-blue-500/50";
  const buttonColor = type === "found" ? "bg-cyan-500 hover:bg-cyan-400" : "bg-blue-500 hover:bg-blue-400";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-white px-4">
      
      {/* Floating Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/10 active:scale-95"
      >
        ← Back to Dashboard
      </button>

      <div className={`bg-gray-900/70 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md shadow-2xl border ${themeColor} animate-fadeUp`}>
        <div className="text-center mb-8">
            <span className="text-4xl mb-2 block">
                {type === "found" ? "🔍" : "🎒"}
            </span>
            <h2 className="text-3xl font-bold tracking-tighter">{title}</h2>
            <p className="text-gray-400 text-sm mt-2">Please fill in the details below</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">ITEM NAME</label>
            <input
                type="text"
                placeholder="What did you find/lose?"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-white transition-all"
                required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">DESCRIPTION</label>
            <textarea
                placeholder="Color, brand, location, etc."
                rows="3"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-white transition-all resize-none"
                required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">CONTACT INFO</label>
            <input
                type="text"
                placeholder="Phone or Social handle"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-white transition-all"
                required
            />
          </div>

          <button
            type="submit"
            className={`${buttonColor} text-black py-4 rounded-xl font-bold mt-4 transition-all active:scale-95 shadow-lg shadow-cyan-500/10`}
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormPage;