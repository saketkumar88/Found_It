import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";

function LostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  
  const navigate = useNavigate();
  const { itemId } = useParams();
  const itemRefs = useRef({});
  const currentUser = localStorage.getItem("collegeId") || localStorage.getItem("collegeEmailId");

  const categories = [
    "All", "Electronics (Phone, Laptop)", "Identity (ID Card, Wallet)", "Keys (Hostel/Cycle)",
    "Books/Stationery", "Lab Equipment", "Cycle/Cycle Accessories", "Clothing/Accessories",
    "Footwear (Shoes, Slides)", "Bottles/Lunchboxes", "Earphones/Headphones", "Chargers/Cables",
    "Watches/Smartbands", "Bags/Backpacks", "Sports Equipment", "Musical Instruments",
    "Calculators", "Umbrellas", "Spectacles/Sunglasses", "Personal Grooming Items",
    "Medical/Medicine Kits", "Others"
  ];

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch("http://localhost:8080/items/lost")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
        if (itemId) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#ffffff', '#60a5fa']
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

  const filteredItems = items.filter(item => {
    const nameStr = (item.itemName || item.name || "").toString().toLowerCase().trim();
    const typeStr = (item.objectType || item.type || item.category || "").toString().toLowerCase().trim();
    const searchStr = searchQuery.toLowerCase().trim();
    const tabStr = activeTab.toLowerCase().trim();
    const matchesSearch = nameStr.includes(searchStr);
    const matchesTab = tabStr === "all" || typeStr.includes(tabStr);
    return matchesSearch && matchesTab;
  });

  const displayedItems = itemId ? items.filter(item => item._id === itemId) : filteredItems;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await fetch(`http://localhost:8080/items/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId: currentUser }),
      });
      if (response.ok) { fetchItems(); }
    } catch (error) { alert("Error deleting item."); }
  };

  const SkeletonCard = () => (
    <div className="bg-gray-900/30 border border-white/5 p-6 rounded-3xl animate-pulse">
      <div className="w-full h-48 bg-white/5 rounded-2xl mb-4"></div>
      <div className="h-6 w-3/4 bg-white/10 rounded mb-2"></div>
      <div className="flex justify-between border-t border-white/5 pt-4">
        <div className="h-8 w-24 bg-white/5 rounded"></div>
        <div className="h-8 w-16 bg-white/5 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white p-4 md:p-8 relative bg-transparent">
      {selectedImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 zoom-in" />
        </div>
      )}

      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button onClick={() => itemId ? navigate("/view-lost") : navigate("/")} className="text-gray-400 hover:text-white transition-colors mb-2 block font-bold text-sm uppercase">
              {itemId ? "← Show All Reports" : "← Dashboard"}
            </button>
            <h1 className="text-4xl md:text-5xl font-black text-blue-500 uppercase tracking-tighter">
               {itemId ? "Found it? 🎯" : "Lost Items 🎒"}
            </h1>
          </div>
          
          {!itemId && (
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search lost items..." 
                className="bg-gray-900 border border-white/10 px-6 py-3 rounded-2xl w-full md:w-80 focus:outline-none focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {!itemId && (
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-2.5 rounded-full whitespace-nowrap text-xs font-bold transition-all border ${
                  activeTab === cat ? 'bg-blue-500 border-blue-500 text-black shadow-lg shadow-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`max-w-6xl mx-auto grid gap-6 ${itemId ? 'flex justify-center' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : displayedItems.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <h2 className="text-xl font-bold text-gray-400">No items found matching your filters.</h2>
            <button onClick={() => {setSearchQuery(""); setActiveTab("All")}} className="text-blue-500 mt-2 underline">Clear all filters</button>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div 
              key={item._id} 
              ref={el => itemRefs.current[item._id] = el}
              className={`bg-gray-900/40 backdrop-blur-md p-6 rounded-[2.5rem] relative flex flex-col border-2 group transition-all duration-300 ${
                itemId === item._id 
                ? 'border-blue-500 shadow-xl scale-[1.02] bg-blue-500/5 w-full max-w-md' 
                : 'border-white/5 hover:border-blue-500/30'
              }`}
            >
              <div className="absolute top-6 left-6 z-10">
                <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-blue-500 text-black">
                  {item.objectType || item.type || 'Lost Item'}
                </span>
              </div>

              {item.reportedBy === currentUser && (
                <button onClick={() => handleDelete(item._id)} className="absolute top-6 right-6 z-20 bg-red-500/20 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                  🗑️
                </button>
              )}

              <div 
                className="w-full h-52 bg-black/40 rounded-3xl mb-6 overflow-hidden border border-white/5 flex items-center justify-center cursor-zoom-in"
                onClick={() => item.image && setSelectedImg(`http://localhost:8080${item.image}`)}
              >
                {item.image ? (
                  <img src={`http://localhost:8080${item.image}`} alt="item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="text-4xl opacity-20">📷</div>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-1 tracking-tight uppercase">{item.itemName}</h3>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 italic">"{item.description}"</p>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-black">Contact</p>
                    <p className="text-blue-200 text-xs font-medium">{item.contact}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase font-black">Date</p>
                    <p className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => window.location.href = `mailto:support@college.edu?subject=Regarding Lost Item: ${item.itemName}`}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                >
                  Found this? Contact
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LostItems;