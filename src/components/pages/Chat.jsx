import React, { useEffect, useRef, useState } from "react";
import "./Chat.css";

const CONTACTS = [
  { id: "m", name: "Bini Mikha", avatar: "/images/mikha.webp", status: "online" },
  { id: "a", name: "Bini Aiah", avatar: "/images/aiah.webp", status: "online" },
  { id: "l", name: "Bini Maloi", avatar: "/images/maloi.webp", status: "offline" },
  { id: "c", name: "Bini Colet", avatar: "/images/colet.webp", status: "online" },
  { id: "j", name: "Bini Jhoanna", avatar: "/images/jhoanna.webp", status: "online" },
  { id: "g", name: "Bini Gwen", avatar: "/images/gwen.webp", status: "offline" },
  { id: "s", name: "Bini Stacey", avatar: "/images/stacey.webp", status: "online" },
  { id: "h", name: "Bini Sheena", avatar: "/images/sheena.webp", status: "offline" },
];

const PRODUCT_CATALOG = [
  { id: "p1", title: "Laptop Bag", price: 600, img: "/images/bag.jpg", type: "Sell" },
  { id: "p2", title: "Muji Notebook", price: 100, img: "/images/notebook.jpg", type: "Sell" },
  { id: "p3", title: "Scientific Calculator", price: 600, img: "/images/calculator.jpg", type: "Sell" },
  { id: "p4", title: "Pen Set", price: 120, img: "/images/pens.jpg", type: "Sell" },
];

const STORAGE_KEY = "tup_chats_v1";

function timeNow() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [chats, setChats] = useState({});
  const [activeContact, setActiveContact] = useState(CONTACTS[0].id);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCatalogContact, setSelectedCatalogContact] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setChats(parsed);
        if (!parsed[activeContact]) {
          setActiveContact(Object.keys(parsed)[0] || CONTACTS[0].id);
        }
        return;
      } catch (e) {
        console.error("Failed parse chat storage", e);
      }
    }

    const initial = {};
    CONTACTS.forEach((c, idx) => {
      initial[c.id] = {
        unread: idx === 1 ? 2 : 0,
        messages: [
          {
            id: `${c.id}-1`,
            from: c.name,
            text: `Hi, I'm ${c.name}. Ask me about ${PRODUCT_CATALOG[idx % PRODUCT_CATALOG.length].title}.`,
            time: timeNow(),
            meta: { productId: PRODUCT_CATALOG[idx % PRODUCT_CATALOG.length].id },
          },
        ],
      };
    });
    setChats(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error("Failed saving chats", e);
    }
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeContact, chats]);

  const contactObj = (id) => CONTACTS.find((c) => c.id === id) || {};

  const sendMessage = (text, meta = null) => {
    if (!text || !text.trim()) return;
    setChats((prev) => {
      const copy = { ...prev };
      const chat = copy[activeContact] || { messages: [], unread: 0 };
      const msg = {
        id: `${activeContact}-${Date.now()}`,
        from: "You",
        text: text.trim(),
        time: timeNow(),
        meta,
      };
      chat.messages = [...chat.messages, msg];
      chat.unread = 0;
      copy[activeContact] = chat;
      return copy;
    });
    setComposer("");
    setTimeout(() => simulateReply(activeContact, text), 800 + Math.random() * 1200);
  };

  const simulateReply = (contactId, userText) => {
    const contact = contactObj(contactId);
    const replies = [
      "Thanks — I'll check and get back to you.",
      "Available. When do you want it?",
      "Can we swap instead?",
      "I'll reserve this for you.",
      "Nice, how many do you need?",
      "Confirming payment method.",
    ];
    const text = replies[Math.floor(Math.random() * replies.length)];
    setChats((prev) => {
      const copy = { ...prev };
      const chat = copy[contactId] || { messages: [], unread: 0 };
      const msg = {
        id: `${contactId}-bot-${Date.now()}`,
        from: contact.name,
        text,
        time: timeNow(),
        meta: null,
      };
      chat.messages = [...chat.messages, msg];
      if (activeContact !== contactId) chat.unread = (chat.unread || 0) + 1;
      copy[contactId] = chat;
      return copy;
    });
  };

  const sendProduct = (product) => {
    const meta = { product };
    const text = `${product.title} • ₱${product.price}`;
    sendMessage(text, meta);
    setShowCatalog(false);
  };

  const openChat = (id) => {
    setActiveContact(id);
    setChats((prev) => {
      const copy = { ...prev };
      if (copy[id]) copy[id] = { ...copy[id], unread: 0 };
      return copy;
    });
  };

  const deleteMessage = (msgId) => {
    setChats((prev) => {
      const copy = { ...prev };
      const chat = copy[activeContact];
      if (!chat) return prev;
      copy[activeContact] = {
        ...chat,
        messages: chat.messages.filter((m) => m.id !== msgId),
      };
      return copy;
    });
  };

  const filteredContacts = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const insertProductInComposer = (product) => {
    setComposer((prev) => `${prev}${prev ? " " : ""}${product.title} ₱${product.price}`);
    setShowCatalog(false);
  };

  const handleExit = () => {
    window.location.href = "/inside-app"; // ✅ Return to app homepage
  };

  return (
    <div className="chat-root">
      {/* LEFT SIDEBAR */}
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-header">
            <h3>Chats</h3>
            <div className="sidebar-actions">
              <button title="New message" className="icon-btn">✚</button>
            </div>
          </div>

          <div className="chat-search">
            <input
              placeholder="Search chats"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="contact-list">
          {filteredContacts.map((c) => {
            const chat = chats[c.id] || { messages: [], unread: 0 };
            const last = chat.messages[chat.messages.length - 1];
            const preview = last ? (last.from === "You" ? `You: ${last.text}` : last.text) : "No messages";
            return (
              <div
                key={c.id}
                className={`contact-item ${activeContact === c.id ? "active" : ""}`}
                onClick={() => openChat(c.id)}
                title={`${c.name} — ${preview}`}
              >
                <div className="contact-left">
                  <img src={c.avatar} alt={c.name} className="contact-avatar" />
                  <div className="contact-meta">
                    <div className="contact-name">{c.name}</div>
                    <div className="contact-preview">{preview}</div>
                  </div>
                </div>
                <div className="contact-right">
                  {chat.unread > 0 && <div className="unread-dot">{chat.unread}</div>}
                  <div className={`status ${c.status}`}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <small className="muted">TUPulse • Student Marketplace</small>
        </div>
      </aside>

      {/* MAIN CHAT PANEL */}
      <main className="chat-main">
        <div className="chat-topbar">
          <div className="top-left">
            <img src={contactObj(activeContact).avatar} alt="" className="top-avatar" />
            <div className="top-meta">
              <div className="top-name">{contactObj(activeContact).name}</div>
              <div className="top-status">
                {contactObj(activeContact).status === "online" ? "Active now" : "Offline"}
              </div>
            </div>
          </div>

          <div className="top-actions">
            <button className="icon-btn small">📞</button>
            <button className="icon-btn small">🎥</button>
            <button
              className="icon-btn small"
              onClick={() => {
                setShowCatalog((s) => !s);
                setSelectedCatalogContact(activeContact);
              }}
              title="Products"
            >
              🛍️
            </button>

            {/* ✅ Added Exit Button */}
            <button className="icon-btn small exit-btn" onClick={handleExit} title="Exit Chat">
              ⬅️
            </button>
          </div>
        </div>

        {/* Rest of chat remains unchanged */}
        <div className="chat-body-area">
          <div className="chat-wallpaper" />
          <div className="messages-column">
            {(!chats[activeContact] || chats[activeContact].messages.length === 0) && (
              <div className="empty-chat">No messages yet. Say hello 👋</div>
            )}

            {(chats[activeContact]?.messages || []).map((m) => (
              <div key={m.id} className={`message-row ${m.from === "You" ? "sent" : "recv"}`}>
                <div className="message-bubble">
                  <div className="message-text">{m.text}</div>
                  {m.meta?.product && (
                    <div className="message-product">
                      <img src={m.meta.product.img} alt={m.meta.product.title} />
                      <div>
                        <div className="prod-title">{m.meta.product.title}</div>
                        <div className="prod-price">₱{m.meta.product.price}</div>
                      </div>
                    </div>
                  )}
                  <div className="message-footer">
                    <span className="time">{m.time}</span>
                    {m.from === "You" && (
                      <button className="msg-del" onClick={() => deleteMessage(m.id)}>✕</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-composer">
          <div className="composer-left">
            <button className="icon-btn">😊</button>
            <button
              className="icon-btn"
              onClick={() => {
                setShowCatalog((s) => !s);
                setSelectedCatalogContact(activeContact);
              }}
              title="Quick products"
            >
              🛒
            </button>
          </div>

          <input
            className="composer-input"
            placeholder={`Message ${contactObj(activeContact).name}...`}
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(composer);
              }
            }}
          />

          <div className="composer-right">
            <button className="send-btn" onClick={() => sendMessage(composer)} disabled={!composer.trim()}>
              Send
            </button>
          </div>
        </div>

        {showCatalog && selectedCatalogContact === activeContact && (
          <div className="product-panel">
            <div className="product-panel-header">
              <strong>Products</strong>
              <button className="icon-btn" onClick={() => setShowCatalog(false)}>✕</button>
            </div>
            <div className="product-list">
              {PRODUCT_CATALOG.map((p) => (
                <div key={p.id} className="product-card">
                  <img src={p.img} alt={p.title} />
                  <div className="product-info">
                    <div className="product-title">{p.title}</div>
                    <div className="product-price">₱{p.price}</div>
                    <div className="product-actions">
                      <button onClick={() => insertProductInComposer(p)}>Insert</button>
                      <button onClick={() => sendProduct(p)}>Send</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
