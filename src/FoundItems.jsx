import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function FoundItems() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("collegeId");

  const fetchItems = () => {
    fetch("http://localhost:8080/items/found")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("Error fetching items:", err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      const response = await fetch(`http://localhost:8080/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId: currentUser }),
      });
      if (response.ok) {
        alert("Deleted!");
        fetchItems();
      }
    } catch (error) {
      alert("Error deleting item.");
    }
  };

  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <button onClick={() => navigate("/")} className="bg-white/10 px-6 py-2 rounded-full border border-white/10 hover:bg-white/20 transition-all">
          ← Dashboard
        </button>
        <h1 className="text-4xl font-black text-cyan-400 uppercase tracking-tighter">Found Items 🔍</h1>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item._id} className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 p-6 rounded-3xl relative hover:border-cyan-500/50 transition-all">
            
            {item.reportedBy === currentUser && (
              <button onClick={() => handleDelete(item._id)} className="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-lg hover:bg-red-500 text-[10px] font-bold">
                Delete
              </button>
            )}

            <div className="mb-4 flex justify-between items-start">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-bold uppercase border border-cyan-500/20">
                {item.objectType}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">{item.itemName}</h3>
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{item.description}</p>
            
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[11px] text-gray-500 uppercase font-bold block">Contact Person</span>
                  <p className="text-sm font-semibold text-cyan-100">{item.contact}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-500 uppercase font-bold block">Reported At</span>
                  <p className="text-[11px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <p className="text-[12px] text-gray-500">By: <span className="text-cyan-400/80">{item.reportedBy}</span></p>
                {item.reportedBy === currentUser && (
                  <span className="text-[8px] bg-cyan-500 text-black px-2 py-1 rounded font-black uppercase">Your Post</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FoundItems;