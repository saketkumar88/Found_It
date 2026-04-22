import React, { useState } from "react";

function LoginSignup() {
  const [mode, setMode] = useState("login"); // 'login', 'signup', or 'forgot'
  const [step, setStep] = useState(1); 
  const [collegeId, setCollegeId] = useState(""); 
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // --- STEP 1: SEND OTP (Signup/Forgot) ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!collegeId.includes("@")) return alert("Please enter a valid college email ID.");
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collegeId.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
      } else {
        alert(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      alert("Server error! Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP + ACTION (Signup/Forgot) ---
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Verify OTP first
      const verifyRes = await fetch("http://localhost:8080/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collegeId.toLowerCase().trim(), otp }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        // OTP valid, proceed to register or reset
        const endpoint = mode === "signup" ? "/signup" : "/api/reset-password";
        const finalRes = await fetch(`http://localhost:8080${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collegeId: collegeId.toLowerCase().trim(), password }),
        });
        
        if (finalRes.ok) {
          alert(mode === "signup" ? "Account created successfully! Please login." : "Password reset successful!");
          setMode("login");
          setStep(1);
          setOtp("");
          setPassword("");
        } else {
          const finalData = await finalRes.json();
          alert(finalData.message);
        }
      } else {
        alert("Invalid OTP. Please check and try again.");
      }
    } catch (error) {
      alert("An error occurred during the verification process.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          collegeId: collegeId.toLowerCase().trim(), 
          password 
        }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("collegeEmailId", collegeId.toLowerCase().trim());
        localStorage.setItem("collegeId", collegeId.toLowerCase().trim());
        localStorage.setItem("email", collegeId.toLowerCase().trim());
        
        window.location.href = "/"; 
      } else {
        alert(data.message || "Invalid Credentials!");
      }
    } catch (error) {
      alert("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative bg-transparent overflow-hidden">
      {/* Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <h1 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
        FOUND-IT
      </h1>

      <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl relative z-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Access"}
        </h2>

        <form 
          onSubmit={mode === "login" ? handleLogin : (step === 1 ? handleSendOTP : handleVerifyAndSubmit)}
          className="flex flex-col gap-4"
        >
          <input
            type="email"
            placeholder="College Email ID"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            disabled={step === 2}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
            required
          />

          {step === 1 && (
            <input
              type="password"
              placeholder={mode === "forgot" ? "New Password" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-cyan-500 outline-none transition-all"
              required
            />
          )}

          {step === 2 && (
            <div className="space-y-2 text-center">
              <p className="text-xs text-cyan-400">Please check your email for the OTP</p>
              <input
                type="text"
                placeholder="6-Digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500 text-white text-center text-xl tracking-widest outline-none"
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Processing..." : (mode === "login" ? "Sign In" : (step === 1 ? "Send OTP" : "Verify & Register"))}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-400">
            {mode === "login" ? "Don't have an account?" : "Already a user?"}{" "}
            <span 
              className="text-cyan-400 font-bold cursor-pointer hover:underline"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setStep(1); }}
            >
              {mode === "login" ? "Register" : "Login"}
            </span>
          </p>
          
          {mode === "login" && (
            <p 
              className="text-xs text-gray-500 cursor-pointer hover:text-white transition-colors"
              onClick={() => { setMode("forgot"); setStep(1); }}
            >
              Forgot Password?
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;