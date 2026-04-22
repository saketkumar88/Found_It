import React from 'react';

const NotificationSidebar = ({
  isOpen,
  onClose,
  notifications = [], 
  onOpenChat
}) => {

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]" 
        onClick={onClose}
      ></div>

      <div className="fixed top-0 right-0 w-[350px] h-full bg-gray-900/90 backdrop-blur-xl border-l border-cyan-500/30 z-[100] p-0 flex flex-col shadow-[0_0_40px_rgba(0,255,255,0.1)]">
        
        {/* Header Section */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-900/20 to-transparent">
          <div>
            <h2 className="text-cyan-400 font-black text-xl tracking-tighter">ALERTS</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Recent Matches</p>
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-90"
          >
            ×
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-gray-400 text-sm italic">All quiet here...</p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const isHighMatch = n.matchScore && n.matchScore >= 50;

              return (
                <div
                  key={n._id || i}
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 transform hover:-translate-x-1 shadow-lg ${
                    isHighMatch 
                    ? 'bg-white/5 border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/5' 
                    : 'bg-white/5 border-white/5 opacity-70 grayscale-[0.5]'
                  }`}
                >
                  {/* Match Score Badge */}
                  {n.matchScore && (
                    <div className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md ${
                      isHighMatch ? 'bg-cyan-500 text-black shadow-cyan-500/50' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {n.matchScore}% Match
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-1.5 animate-pulse shrink-0 ${isHighMatch ? 'bg-cyan-500' : 'bg-gray-500'}`}></div>
                      <p className="text-sm text-gray-200 leading-relaxed font-medium group-hover:text-white transition-colors">
                        {n.message}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {/* CHAT BUTTON */}
                      {isHighMatch ? (
                        <button 
                          onClick={() => n.ownerId ? onOpenChat(n.ownerId) : alert("Owner ID missing!")}
                          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-[10px] transition-all active:scale-95"
                        >
                          💬 CHAT NOW
                        </button>
                      ) : (
                        <div className="flex-1 py-2 bg-gray-800 text-gray-500 font-bold rounded-xl text-[10px] text-center border border-white/5 italic">
                          🔒 CHAT LOCKED
                        </div>
                      )}

                      {/* ✅ UPDATED VIEW ITEM BUTTON */}
                      <button 
                        onClick={() => {
                          onClose();
                          if (n.itemId) {
                            // Agar item 'lost' category ka hai toh 'view-lost' par bhejo, warna 'view-found'
                            // Note: Backend se 'n.itemType' aana chahiye, agar nahi aa raha toh logic adjust kar sakte hain
                            const path = n.itemType === 'lost' ? 'view-lost' : 'view-found';
                            window.location.href = `/${path}/${n.itemId}`;
                          } else {
                            alert("Item reference not found!");
                          }
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[10px] border border-white/10 transition-all"
                      >
                        👁️ VIEW ITEM
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <p className="text-[10px] text-center text-gray-600">
            Powered by FoundIt Vision System
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationSidebar;