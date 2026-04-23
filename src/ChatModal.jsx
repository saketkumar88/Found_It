import React, { useState, useEffect, useRef } from 'react';
import socket from './socket'; // ✅ Tera fixed socket instance

const ChatModal = ({ isOpen, onClose, currentUser, targetUser }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // ✅ GPT wala SAFE CHAT ID logic
    const chatId = currentUser && targetUser 
        ? [currentUser, targetUser].sort().join('_')
        : null;

    useEffect(() => {
        if (isOpen && chatId) {
            socket.emit('join_chat', chatId);

            // Purani messages fetch karna
            fetch(`http://localhost:8080/api/messages/${chatId}`)
                .then(res => res.json())
                .then(data => {
                    if(Array.isArray(data)) setChatHistory(data);
                })
                .catch(err => console.error("History fetch error:", err));

            // Keyboard focus
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, chatId]);

    useEffect(() => {
        const handleNewMessage = (data) => {
            if (data.chatId === chatId) {
                setChatHistory(prev => [...prev, data]);
            }
        };

        socket.on('receive_message', handleNewMessage);
        return () => socket.off('receive_message', handleNewMessage);
    }, [chatId]);

    // Auto scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !chatId) return;

        const msgData = {
            chatId: chatId,
            senderId: currentUser,
            text: message,
            createdAt: new Date()
        };

        socket.emit('send_message', msgData);

        setMessage('');
    };

    if (!isOpen || !targetUser) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            {/* Main Chat Container - Cyberpunk UI */}
            <div className="w-full max-w-lg h-[600px] bg-[#0d1117] border border-cyan-500/30 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,255,0.2)] animate-in fade-in zoom-in duration-300">
                
                {/* Header Section */}
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-cyan-900/20 to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-black shadow-lg shadow-cyan-500/20">
                            {targetUser?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm tracking-tight">{targetUser}</h3>
                            <p className="text-[10px] text-cyan-400 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span> Secure Chat
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">×</button>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] custom-scrollbar">
                    {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <p className="text-gray-400 text-xs italic">Start your conversation safely...</p>
                        </div>
                    ) : (
                        chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.senderId === currentUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl shadow-md transition-all ${
                                    msg.senderId === currentUser 
                                    ? 'bg-cyan-600 text-white rounded-tr-none border border-cyan-400/30' 
                                    : 'bg-gray-800 text-gray-100 rounded-tl-none border border-white/5'
                                }`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <span className="text-[9px] opacity-60 mt-2 block text-right">
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Footer */}
                <form onSubmit={sendMessage} className="p-4 bg-gray-900/50 border-t border-white/10 flex gap-3 items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-gray-600"
                    />
                    <button 
                        type="submit"
                        disabled={!message.trim()}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black p-3 rounded-full transition-transform active:scale-90 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;