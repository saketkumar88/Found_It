import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function FormPage({ type }) {
  const navigate = useNavigate();

  const [itemName, setItemName] = useState("");
  const [objectType, setObjectType] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // NEW: State for AI matches and Modal visibility
  const [matches, setMatches] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ✅ Expanded Categories (20 items + Others at the end)
  const categories = [
    "Electronics (Phone, Laptop)",
    "Identity (ID Card, Wallet)",
    "Keys (Hostel/Cycle)",
    "Books/Stationery",
    "Lab Equipment",
    "Cycle/Cycle Accessories",
    "Clothing/Accessories",
    "Footwear (Shoes, Slides)",
    "Bottles/Lunchboxes",
    "Earphones/Headphones",
    "Chargers/Cables",
    "Watches/Smartbands",
    "Bags/Backpacks",
    "Sports Equipment",
    "Musical Instruments",
    "Calculators",
    "Umbrellas",
    "Spectacles/Sunglasses",
    "Personal Grooming Items",
    "Medical/Medicine Kits",
    "Others"
  ];

  const title = type === "found" ? "Report Found Item" : "Report Lost Item";
  const themeColor = type === "found" ? "border-cyan-500/50" : "border-blue-500/50";
  const buttonColor = type === "found" ? "bg-cyan-500 hover:bg-cyan-400" : "bg-blue-500 hover:bg-blue-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!objectType) return alert("Please select an object type");
    
    setLoading(true);
    const collegeId = localStorage.getItem("collegeId");

    const formData = new FormData();
    formData.append("itemName", itemName);
    formData.append("objectType", objectType);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("contact", contact);
    formData.append("reportedBy", collegeId);
    
    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await fetch("http://localhost:8080/report", {
        method: "POST",
        body: formData, 
      });

      const data = await response.json();

      if (response.ok) {
        // Check if backend returned any automatic AI matches
        if (data.autoMatches && data.autoMatches.length > 0) {
          setMatches(data.autoMatches);
          setShowModal(true);
        } else {
          alert("Report submitted successfully!");
          navigate("/");
        }
      } else {
        alert(data.message || "Failed to submit report.");
      }
    } catch (error) {
      alert("Connection error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-white px-4 relative">
      
      {/* --- AI MATCHES MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-white/20 w-full max-w-2xl rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                🚀 AI Found Potential Matches!
              </h2>
              <p className="text-gray-400 text-sm mt-1">We found items that look similar to your report.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {matches.map((item) => (
                <div key={item._id} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                  <img 
                    src={`http://localhost:8080${item.image}`} 
                    alt="match" 
                    className="w-24 h-24 object-cover rounded-xl border border-white/10"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg">{item.itemName}</h4>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                        {item.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-white/10 px-2 py-1 rounded text-gray-300">Contact: {item.contact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate("/")} 
              className="mt-6 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Continue to Home
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/")} className="absolute top-8 left-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full font-semibold border border-white/10 active:scale-95">
        ← Back
      </button>

      <div className={`bg-gray-900/70 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md border ${themeColor} animate-fadeUp ${showModal ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">{type === "found" ? "🔍" : "🎒"}</span>
            <h2 className="text-3xl font-bold tracking-tighter">{title}</h2>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">ITEM NAME</label>
            <input
                type="text"
                placeholder="e.g. iPhone 13, Nike Bag"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-white outline-none transition-all"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">OBJECT TYPE</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-white outline-none transition-all appearance-none cursor-pointer"
                value={objectType}
                onChange={(e) => setObjectType(e.target.value)}
                required
              >
                <option value="" disabled className="bg-gray-900">Select Category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat} className="bg-gray-900">{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">DESCRIPTION</label>
            <textarea
                placeholder="Details like color, place found/lost..."
                rows="2"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-white outline-none transition-all resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">CONTACT INFO</label>
            <input
                type="text"
                placeholder="Phone No."
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-white outline-none transition-all"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">UPLOAD IMAGE</label>
            <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <button type="submit" disabled={loading} className={`${buttonColor} text-black py-4 rounded-xl font-bold mt-2 transition-all active:scale-95 disabled:opacity-50`}>
            {loading ? "AI Processing..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormPage;