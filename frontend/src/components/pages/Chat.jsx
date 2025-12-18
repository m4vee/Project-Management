import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchUserThreads, fetchThreadMessages, sendMessage } from "../../services/api";
import "./Chat.css";

const BACKEND_URL = "http://127.0.0.1:5000";

export default function Chat() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUserId = localStorage.getItem("user_id");
    
    const [threads, setThreads] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); 
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isSearching, setIsSearching] = useState(false); 

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const searchTimeoutRef = useRef(null); 

    const fetchThreadsSilently = async (query = "") => {
        try {
            const data = await fetchUserThreads(currentUserId, query); 
            setThreads(data);
        } catch (err) {
            console.error("Error loading threads silently", err);
        }
    };

    const loadThreads = async (query = searchTerm, isInitialLoad = false) => {
        try {
            if (isInitialLoad || isSearching) setLoading(true); 
            
            const data = await fetchUserThreads(currentUserId, query); 
            setThreads(data);
        } catch (err) {
            console.error("Error loading threads", err);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!currentUserId) {
            navigate("/login");
            return;
        }

        loadThreads(searchTerm, true);
        
        const params = new URLSearchParams(location.search);
        const targetUserId = params.get('user');
        
        if (targetUserId) {
            fetchUserThreads(currentUserId, targetUserId).then(allThreads => {
                setThreads(allThreads);
                const targetThread = allThreads.find(t => t.partner_id === parseInt(targetUserId));
                
                const placeholderThread = { 
                    partner_id: parseInt(targetUserId), 
                    partner_name: "New Chat User", 
                    partner_image: null 
                };

                handleSelectChat(targetThread || placeholderThread);
            });
            window.history.replaceState(null, '', '/chat');
        }

        const interval = setInterval(() => fetchThreadsSilently(searchTerm), 5000); 
        return () => clearInterval(interval);
    }, [currentUserId]); 

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        setIsSearching(true);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            loadThreads(query, false);
        }, 300);
    };

    const handleSelectChat = async (thread) => {
        const partnerId = thread.partner_id;
        
        const existingThread = threads.find(t => t.partner_id === partnerId);
        
        setActiveChat({
            ...thread,
            partner_id: partnerId,
            partner_name: existingThread?.partner_name || thread.partner_name, 
            partner_image: existingThread?.partner_image || thread.partner_image
        });

        setLoading(true);
        await loadMessages(partnerId);
        setLoading(false);
    };

    const loadMessages = async (partnerId) => {
        try {
            const msgs = await fetchThreadMessages(partnerId, currentUserId);
            setMessages(msgs);
            scrollToBottom();
            fetchThreadsSilently();
        } catch (err) {
            console.error("Error loading messages", err);
        }
    };

    useEffect(() => {
        let interval;
        if (activeChat) {
            interval = setInterval(() => {
                fetchThreadMessages(activeChat.partner_id, currentUserId).then(msgs => {
                    if(msgs.length !== messages.length) {
                        setMessages(msgs);
                        scrollToBottom();
                    }
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [activeChat, messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append("sender_id", currentUserId);
            formData.append("receiver_id", activeChat.partner_id);
            formData.append("message", newMessage.trim() || (selectedFile ? "Sent a file" : "")); 

            if (selectedFile) {
                formData.append("image", selectedFile);
            }

            const response = await sendMessage(formData);
            
            const newMsgObj = {
                id: response.id, 
                sender_id: parseInt(currentUserId),
                message: newMessage,
                image_url: response.image_url,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, newMsgObj]);
            setNewMessage("");
            setSelectedFile(null);
            setPreviewUrl(null);
            scrollToBottom();
            fetchThreadsSilently();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const handleViewProfile = (partnerId) => {
        if (partnerId) {
            navigate(`/user-profile/${partnerId}`);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const getProfileImg = (path) => {
        if (!path) return "/images/default-profile.jpg";
        return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
    };


    return (
        <div className="chat-container fade-in">
            
            <div className={`chat-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
                <div className="sidebar-header">
                    <h2>Chats</h2>
                    <div className="search-bar">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    {isSearching && <div className="search-status">Searching...</div>}
                </div>

                <div className="threads-list">
                    {loading ? (
                        <div className="loading-chat">Loading chats...</div>
                    ) : threads.length === 0 && !searchTerm ? (
                        <div className="no-threads">No conversation history found. Search for a user above.</div>
                    ) : threads.length === 0 && searchTerm ? (
                        <div className="no-threads">No users match "{searchTerm}".</div>
                    ) : (
                        threads.map(thread => (
                            <div 
                                key={thread.partner_id} 
                                className={`thread-item ${activeChat?.partner_id === thread.partner_id ? 'active' : ''} ${!thread.is_read && thread.last_sender_id !== parseInt(currentUserId) ? 'unread' : ''}`}
                                onClick={() => handleSelectChat(thread)}
                            >
                                
                                <div 
                                    className="avatar-wrapper" 
                                    onClick={(e) => { e.stopPropagation(); handleViewProfile(thread.partner_id); }}
                                    style={{cursor: 'pointer'}} 
                                >
                                    <img src={getProfileImg(thread.partner_image)} alt={thread.partner_name} />
                                    <span className="online-dot"></span>
                                </div>
                                <div className="thread-info">
                                    <h4>{thread.partner_name}</h4>
                                    <p className="last-msg">
                                        {thread.last_message ? (
                                            <>
                                                {thread.last_sender_id === parseInt(currentUserId) ? "You: " : ""}
                                                {thread.last_message.length > 30 ? thread.last_message.substring(0, 30) + "..." : thread.last_message}
                                            </>
                                        ) : thread.last_message === null && searchTerm ? (
                                            "Click to start new chat" 
                                        ) : (
                                            "Sent a file" 
                                        )}
                                    </p>
                                </div>
                                {thread.last_message_time && (
                                    <span className="msg-time">
                                        {new Date(thread.last_message_time).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true 
                                        })}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`chat-main ${!activeChat ? 'mobile-hidden' : ''}`}>
                
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <button className="back-btn mobile-only" onClick={() => setActiveChat(null)}>
                                <i className="fa-solid fa-arrow-left"></i>
                            </button>
                            
                            {/* 2. Chat Header Partner Info: Ginawa mo na ito sa parent div */}
                            <div className="chat-partner-info" onClick={() => handleViewProfile(activeChat.partner_id)} style={{cursor: 'pointer'}}>
                                <img src={getProfileImg(activeChat.partner_image)} alt="User" />
                                <div>
                                    <h3>{activeChat.partner_name}</h3>
                                    <span className="status-text">View Profile</span> 
                                </div>
                            </div>
                            
                            <button className="info-btn" onClick={() => handleViewProfile(activeChat.partner_id)}>
                                <i className="fa-solid fa-circle-info"></i>
                            </button>
                        </div>

                        <div className="messages-area">
                            {loading ? (
                                <div className="loading-chat"><div className="spinner"></div></div>
                            ) : messages.length === 0 ? (
                                <div className="empty-chat-state">
                                    <img src={getProfileImg(activeChat.partner_image)} className="big-avatar" alt="" />
                                    <h3>{activeChat.partner_name}</h3>
                                    <p>You are now connected on TUPulse.</p>
                                    <p>Say hello! 👋</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = msg.sender_id === parseInt(currentUserId);
                                    return (
                                        <div key={index} className={`message-row ${isMe ? 'me' : 'them'}`}>
                                            
                                            {!isMe && <img 
                                                src={getProfileImg(msg.sender_image || activeChat.partner_image)} 
                                                className="msg-avatar" 
                                                alt="" 
                                                onClick={() => handleViewProfile(msg.sender_id)} 
                                                style={{cursor: 'pointer'}}
                                            />}
                                            
                                            <div className="message-content">
                                                {msg.image_url && (
                                                    <img 
                                                        src={msg.image_url.startsWith('http') ? msg.image_url : `${BACKEND_URL}${msg.image_url}`} 
                                                        className="msg-attachment" 
                                                        alt="Attachment" 
                                                    />
                                                )}
                                                {msg.message && msg.message.trim() !== "Sent a file" && <div className="msg-bubble">{msg.message}</div>}
                                                <span className="msg-timestamp">
                                                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true 
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSend}>
                            
                            {previewUrl && (
                                <div className="image-preview-container">
                                    <img src={previewUrl} alt="Preview" />
                                    <button type="button" onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}>
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            )}

                            <div className="input-wrapper">
                                <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}>
                                    <i className="fa-solid fa-image"></i>
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    hidden 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                                
                                <input 
                                    type="text" 
                                    placeholder="Type a message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => { 
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault(); 
                                            handleSend(e); 
                                        }
                                    }}
                                />
                                
                                <button 
                                    type="button" 
                                    className="send-btn" 
                                    onClick={handleSend} 
                                    disabled={isSending || (!newMessage.trim() && !selectedFile)}
                                >
                                    <i className="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <i className="fa-regular fa-comments"></i>
                        <h2>Select a conversation</h2>
                        <p>Choose a user from the left sidebar to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}