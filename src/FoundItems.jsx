import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";

function FoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimDetails, setClaimDetails] = useState({ phone: "", proof: "" });

  const navigate = useNavigate();
  const { itemId } = useParams();
  const itemRefs = useRef({});

  const currentUser = localStorage.getItem("collegeId") || localStorage.getItem("collegeEmailId");

  // ✅ Updated to full 21 categories matching FormPage
  const categories = [
    "All",
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

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch("http://localhost:8080/items/found")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
        if (itemId) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00BCD4', '#ffffff', '#22D3EE']
          });
          setTimeout(() => {
            itemRefs.current[itemId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      })
      .catch((err) => {
        console.error("Error fetching items:", err);
        setLoading(false);
      });
  }, [itemId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ✅ UPDATED FILTER LOGIC: Robust partial matching for expanded categories
  const filteredItems = items.filter(item => {
    const nameStr = (item.itemName || item.name || "").toString().toLowerCase().trim();
    const typeStr = (item.objectType || item.type || item.category || "").toString().toLowerCase().trim();

    const searchStr = searchQuery.toLowerCase().trim();
    const tabStr = activeTab.toLowerCase().trim();

    const matchesSearch = nameStr.includes(searchStr);

    // Logic: Matches if "All" is selected OR if the item's category contains the tab name
    const matchesTab = tabStr === "all" || typeStr.includes(tabStr);

    return matchesSearch && matchesTab;
  });

  const displayedItems = itemId
    ? items.filter(item => item._id === itemId)
    : filteredItems;

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/claims/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: claimingItem._id,
          claimerCollegeId: currentUser.toLowerCase(),
          founderCollegeId: claimingItem.reportedBy.toLowerCase(),
          phone: claimDetails.phone,
          proofDescription: claimDetails.proof,
          itemName: (claimingItem.itemName || claimingItem.name)
        }),
      });

      if (response.ok) {
        alert(`Claim request sent for: ${claimingItem.itemName || claimingItem.name}`);
      } else {
        alert("Failed to send claim request.");
      }
    } catch (error) {
      console.error("Claim Error:", error);
    }
    setIsClaimModalOpen(false);
    setClaimDetails({ phone: "", proof: "" });
  };

  const handleClaim = async (item) => {
    try {
      const response = await fetch("http://localhost:8080/api/claims/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item._id,
          claimerCollegeId: currentUser,
          founderCollegeId: item.reportedBy,
          phone: "1234567890", // TODO: collect from user input
          proofDescription: "I lost this item, here’s proof", // TODO: collect from user input
          itemName: item.itemName
        })
      });
      if (response.ok) {
        alert("Claim submitted! Waiting for founder approval.");
      } else {
        alert("Failed to submit claim.");
      }
    } catch (err) {
      console.error("Error submitting claim:", err);
      alert("Error submitting claim.");
    }
  };

  const SkeletonCard = () => (
    <div className="bg-gray-900/30 border border-white/5 p-6 rounded-3xl animate-pulse">
      <div className="w-full h-48 bg-white/5 rounded-2xl mb-4"></div>
      <div className="h-6 w-3/4 bg-white/10 rounded mb-2"></div>
      <div className="h-12 w-full bg-white/5 rounded-xl"></div>
    </div>
  );

  return (
    <div className="min-h-screen text-white p-4 md:p-8 relative bg-transparent">
      {/* Zoom Modal */}
      {selectedImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-2xl border border-cyan-500/20 shadow-2xl" />
        </div>
      )}

      {/* Claim Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-cyan-500/30 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-2 text-cyan-400 uppercase tracking-tight">CLAIM ITEM</h2>
            <p className="text-gray-400 text-sm mb-6 uppercase font-bold text-[10px]">Provide proof to the founder</p>
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <input required type="tel" placeholder="Your Phone Number" className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none transition-all" value={claimDetails.phone} onChange={(e) => setClaimDetails({ ...claimDetails, phone: e.target.value })} />
              <textarea required placeholder="Describe proof of ownership..." className="w-full bg-black border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none h-32 transition-all" value={claimDetails.proof} onChange={(e) => setClaimDetails({ ...claimDetails, proof: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsClaimModalOpen(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-cyan-500 text-black rounded-2xl font-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button onClick={() => itemId ? navigate("/view-found") : navigate("/")} className="text-gray-500 hover:text-cyan-400 transition-colors mb-2 block text-sm font-bold uppercase tracking-widest">
              {itemId ? "← Back to List" : "← Dashboard"}
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-cyan-400 uppercase tracking-tighter">
              {itemId ? "Found Something? 🎯" : "Found Reports 🎒"}
            </h1>
          </div>

          {!itemId && (
            <input
              type="text"
              placeholder="Search items..."
              className="bg-gray-900 border border-white/10 px-6 py-4 rounded-2xl w-full md:w-80 focus:border-cyan-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
        </div>

        {/* Categories Bar */}
        {!itemId && (
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-2.5 rounded-full whitespace-nowrap text-xs font-bold transition-all border ${activeTab === cat ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className={`max-w-6xl mx-auto grid gap-8 ${itemId ? 'flex justify-center' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : displayedItems.length === 0 ? (
          <div className="col-span-full text-center py-20 opacity-30">
            <p className="text-xl font-bold italic">No items found matching the current filters.</p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item._id}
              ref={el => itemRefs.current[item._id] = el}
              className={`bg-gray-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] relative flex flex-col border-2 group transition-all duration-300 ${itemId === item._id ? 'border-cyan-500 shadow-2xl w-full max-w-md' : 'border-white/5 hover:border-cyan-500/30'
                }`}
            >
              <div className="absolute top-6 left-6 z-10">
                <span className="bg-cyan-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                  {item.objectType || item.type || "Item"}
                </span>
              </div>

              <div
                className="w-full h-56 bg-black/60 rounded-[2rem] mb-6 overflow-hidden border border-white/5 flex items-center justify-center cursor-zoom-in"
                onClick={() => item.image && setSelectedImg(`http://localhost:8080${item.image}`)}
              >
                {item.image ? (
                  <img src={`http://localhost:8080${item.image}`} alt="item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <span className="text-5xl opacity-10">📦</span>
                )}
              </div>

              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{item.itemName || item.name}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 italic">"{item.description}"</p>

              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span>📍 {item.contact}</span>
                  <span>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</span>
                </div>

                {item.reportedBy !== currentUser ? (
                  <button
                    onClick={() => {
                      // Only open modal if not resolved
                      if (item.status !== 'Resolved') {
                        setClaimingItem(item);
                        setIsClaimModalOpen(true);
                      }
                    }}
                    disabled={item.status === 'Resolved'}
                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg 
      ${item.status === 'Resolved'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-cyan-500 text-black hover:bg-white hover:scale-[1.02]'}`}
                  >
                    {item.status === 'Resolved' ? "Already Returned ✅" : "Claim Now"}
                  </button>
                ) : (
                  <button disabled className="w-full py-4 bg-gray-800 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed opacity-50">
                    Your Post
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FoundItems;