"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Send, MessageCircle, Trash2, User,
    Phone, Stethoscope, Menu, X, Pin, PinOff, CheckSquare,
    Square, XCircle, Trash
} from "lucide-react";
import { getClientSession } from "@/app/utils/auth-api";

const MAX_PINS = 5;

function ChatPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialChat = searchParams.get('with');

    const [user, setUser] = useState(null);
    const [currentChat, setCurrentChat] = useState(initialChat || null);
    const [clients, setClients] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [otherUser, setOtherUser] = useState(null);

    // Pin & Delete states
    const [pinnedEmails, setPinnedEmails] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const longPressTimer = useRef(null);
    const longPressTriggered = useRef(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const currentChatRef = useRef(currentChat);

    // Keep ref in sync
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    // Load pinned chats from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('pinned_chats');
            if (saved) setPinnedEmails(JSON.parse(saved));
        } catch (e) { /* ignore */ }
    }, []);

    // Save pinned chats
    const savePins = (pins) => {
        setPinnedEmails(pins);
        localStorage.setItem('pinned_chats', JSON.stringify(pins));
    };

    // Auth check
    useEffect(() => {
        const session = getClientSession();
        if (!session) {
            router.push('/login');
            return;
        }
        setUser(session);
        setLoading(false);
    }, [router]);

    // Fetch chat partners (sidebar) with polling
    useEffect(() => {
        if (!user?.email) return;

        const fetchClients = async () => {
            try {
                const res = await fetch(`/api/chat?user=${encodeURIComponent(user.email)}`);
                const data = await res.json();
                if (Array.isArray(data.clients)) {
                    setClients(data.clients);
                }
            } catch (err) {
                console.error('Error fetching clients:', err);
            }
        };

        fetchClients();
        const interval = setInterval(fetchClients, 5000);
        return () => clearInterval(interval);
    }, [user]);

    // Fetch messages with polling
    useEffect(() => {
        if (!user?.email || !currentChat) return;

        setMessages([]);

        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const res = await fetch(
                    `/api/chat?user=${encodeURIComponent(user.email)}&other=${encodeURIComponent(currentChat)}`,
                    { cache: 'no-store' }
                );
                const data = await res.json();
                if (isMounted && Array.isArray(data.messages)) {
                    setMessages(prev => {
                        if (prev.length === data.messages.length &&
                            JSON.stringify(prev) === JSON.stringify(data.messages)) {
                            return prev;
                        }
                        return data.messages;
                    });
                }
            } catch (err) {
                if (isMounted) console.error('Error fetching messages:', err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [user, currentChat]);

    // Fetch other user info
    useEffect(() => {
        if (!currentChat) { setOtherUser(null); return; }
        const fetchOtherUser = async () => {
            try {
                const res = await fetch(`/api/users?email=${encodeURIComponent(currentChat)}`);
                const data = await res.json();
                if (data.success) setOtherUser(data.user);
            } catch (err) {
                console.error('Error fetching other user:', err);
            }
        };
        fetchOtherUser();
    }, [currentChat]);

    // Send message
    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !currentChat || !user?.email) return;

        const messageData = {
            from: user.email,
            to: currentChat,
            content: newMessage.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, { ...messageData, isSent: true }]);
        setNewMessage('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to send message');
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    }, [newMessage, currentChat, user]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ---- PIN LOGIC ----
    const togglePin = (email, e) => {
        e.stopPropagation();
        if (pinnedEmails.includes(email)) {
            savePins(pinnedEmails.filter(e => e !== email));
        } else {
            if (pinnedEmails.length >= MAX_PINS) {
                return; // limit reached
            }
            savePins([...pinnedEmails, email]);
        }
    };

    // ---- LONG PRESS FOR SELECT MODE ----
    const handlePointerDown = (email) => {
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            if (!selectMode) {
                setSelectMode(true);
                setSelectedEmails(new Set([email]));
            } else {
                toggleSelect(email);
            }
        }, 500); // 500ms long press
    };

    const handlePointerUp = () => {
        clearTimeout(longPressTimer.current);
    };

    const handlePointerLeave = () => {
        clearTimeout(longPressTimer.current);
    };

    // ---- SELECT MODE ----
    const toggleSelect = (email) => {
        setSelectedEmails(prev => {
            const next = new Set(prev);
            if (next.has(email)) {
                next.delete(email);
            } else {
                next.add(email);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedEmails(new Set(clients.map(c => c.email)));
    };

    const clearSelection = () => {
        setSelectMode(false);
        setSelectedEmails(new Set());
    };

    // ---- DELETE LOGIC ----
    const deleteConversation = async (email) => {
        if (!user?.email) return;
        try {
            await fetch('/api/chat', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, otherEmail: email }),
            });
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleDeleteSelected = async () => {
        const emails = Array.from(selectedEmails);
        // Delete all selected in parallel
        await Promise.all(emails.map(email => deleteConversation(email)));
        // Remove from UI
        setClients(prev => prev.filter(c => !selectedEmails.has(c.email)));
        // Unpin deleted
        savePins(pinnedEmails.filter(e => !selectedEmails.has(e)));
        if (selectedEmails.has(currentChat)) {
            setCurrentChat(null);
            setMessages([]);
        }
        clearSelection();
    };

    const handleDeleteAll = async () => {
        await Promise.all(clients.map(c => deleteConversation(c.email)));
        setClients([]);
        savePins([]);
        setCurrentChat(null);
        setMessages([]);
        clearSelection();
    };

    const handleSingleDelete = async (email, e) => {
        e.stopPropagation();
        await deleteConversation(email);
        setClients(prev => prev.filter(c => c.email !== email));
        savePins(pinnedEmails.filter(e => e !== email));
        if (currentChat === email) {
            setCurrentChat(null);
            setMessages([]);
        }
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0 && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Sort clients: pinned first, then rest
    const sortedClients = [
        ...clients.filter(c => pinnedEmails.includes(c.email)),
        ...clients.filter(c => !pinnedEmails.includes(c.email)),
    ];

    // Handle click on sidebar item
    const handleClientClick = (email) => {
        if (longPressTriggered.current) return; // was a long press, don't navigate
        if (selectMode) {
            toggleSelect(email);
        } else {
            setCurrentChat(email);
            setShowSidebar(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MessageCircle size={24} className="text-teal-500" />
                        Messages
                    </h1>
                </div>
                <button
                    className="md:hidden p-2 rounded-xl bg-teal-500 text-white"
                    onClick={() => setShowSidebar(!showSidebar)}
                >
                    {showSidebar ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            <div className="flex" style={{ height: 'calc(100vh - 73px)' }}>
                {/* Sidebar - Chat Partners */}
                <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 overflow-y-auto flex flex-col`}>
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="font-bold text-zinc-900 dark:text-white">Conversations</h2>
                            <div className="flex items-center gap-1">
                                {!selectMode ? (
                                    <button
                                        onClick={() => { setSelectMode(true); setSelectedEmails(new Set()); }}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        title="Select chats"
                                    >
                                        <CheckSquare size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={clearSelection}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        title="Cancel"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">{clients.length} chat{clients.length !== 1 ? 's' : ''} · {pinnedEmails.length}/{MAX_PINS} pinned</p>
                    </div>

                    {/* Select Mode Actions Bar */}
                    {selectMode && (
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-teal-50 dark:bg-teal-900/20 flex items-center gap-2">
                            <span className="text-xs font-medium text-teal-700 dark:text-teal-300 flex-1">
                                {selectedEmails.size} selected
                            </span>
                            <button
                                onClick={selectAll}
                                className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedEmails.size === 0}
                                className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="text-xs px-2 py-1 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors flex items-center gap-1"
                            >
                                <Trash size={12} /> All
                            </button>
                        </div>
                    )}

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {clients.length === 0 ? (
                            <div className="p-6 text-center">
                                <MessageCircle size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                                <p className="text-sm text-zinc-500">No conversations yet</p>
                                <button
                                    onClick={() => router.push('/doctors')}
                                    className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                                >
                                    Find a doctor to chat with
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Pinned Section */}
                                {sortedClients.some(c => pinnedEmails.includes(c.email)) && (
                                    <div className="px-4 pt-3 pb-1">
                                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                                            <Pin size={10} /> Pinned
                                        </span>
                                    </div>
                                )}

                                {sortedClients.map((client, index) => {
                                    const isPinned = pinnedEmails.includes(client.email);
                                    const isSelected = selectedEmails.has(client.email);
                                    const isActive = currentChat === client.email;

                                    // Show "Other" label when transitioning from pinned to unpinned
                                    const showOtherLabel =
                                        !isPinned &&
                                        index > 0 &&
                                        pinnedEmails.includes(sortedClients[index - 1]?.email);

                                    return (
                                        <React.Fragment key={client.email || index}>
                                            {showOtherLabel && (
                                                <div className="px-4 pt-3 pb-1">
                                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                                                        All Chats
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                onClick={() => handleClientClick(client.email)}
                                                onPointerDown={() => handlePointerDown(client.email)}
                                                onPointerUp={handlePointerUp}
                                                onPointerLeave={handlePointerLeave}
                                                onContextMenu={(e) => e.preventDefault()}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group select-none
                                                    ${isActive && !selectMode ? 'bg-teal-50 dark:bg-teal-900/20 border-r-2 border-teal-500' : ''}
                                                    ${isSelected ? 'bg-red-50 dark:bg-red-900/15' : ''}
                                                    ${isPinned && !isSelected ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}
                                                    hover:bg-zinc-50 dark:hover:bg-zinc-800
                                                `}
                                            >
                                                {/* Checkbox in select mode */}
                                                {selectMode && (
                                                    <div className="flex-shrink-0">
                                                        {isSelected ? (
                                                            <CheckSquare size={18} className="text-red-500" />
                                                        ) : (
                                                            <Square size={18} className="text-zinc-400" />
                                                        )}
                                                    </div>
                                                )}

                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${isPinned
                                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                        : 'bg-gradient-to-br from-teal-400 to-cyan-500'
                                                    }`}>
                                                    {client.username?.charAt(0).toUpperCase() || '?'}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                                                            {client.role === 'doctor' ? 'Dr. ' : ''}{client.username}
                                                        </h3>
                                                        {isPinned && <Pin size={12} className="text-amber-500 flex-shrink-0" />}
                                                    </div>
                                                    <p className="text-xs text-zinc-500 truncate">{client.email}</p>
                                                </div>

                                                {/* Actions (only when NOT in select mode) */}
                                                {!selectMode && (
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => togglePin(client.email, e)}
                                                            className={`p-1.5 rounded-lg transition-colors ${isPinned
                                                                    ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                                    : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                                }`}
                                                            title={isPinned ? 'Unpin' : (pinnedEmails.length >= MAX_PINS ? `Max ${MAX_PINS} pins` : 'Pin')}
                                                        >
                                                            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleSingleDelete(client.email, e)}
                                                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                {currentChat ? (
                    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-white dark:bg-zinc-900">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <h2 className="font-bold text-zinc-900 dark:text-white">
                                    {otherUser?.role === 'doctor' ? 'Dr. ' : ''}{otherUser?.name || currentChat}
                                </h2>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    {otherUser?.specialization && (
                                        <span className="flex items-center gap-1">
                                            <Stethoscope size={12} />
                                            {otherUser.specialization}
                                        </span>
                                    )}
                                    {otherUser?.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone size={12} />
                                            {otherUser.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <MessageCircle size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                                        <p className="text-zinc-500">No messages yet. Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, index) => {
                                        const isSent = msg.from === user.email;
                                        return (
                                            <div
                                                key={msg.id || `${msg.timestamp}-${index}`}
                                                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isSent
                                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                                        }`}
                                                >
                                                    <p className="break-words text-sm">{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-zinc-400'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                                <MessageCircle size={36} className="text-teal-500" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Welcome to Chat</h2>
                            <p className="text-zinc-500 max-w-sm">Select a conversation from the sidebar or find a doctor to start chatting</p>
                            <button
                                onClick={() => router.push('/doctors')}
                                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-all"
                            >
                                Find a Doctor
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
