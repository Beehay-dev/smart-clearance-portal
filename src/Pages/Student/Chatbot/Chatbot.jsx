import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  FaRobot,
  FaPaperPlane,
  FaSpinner,
  FaUser,
} from 'react-icons/fa';
import './chatbot.css';
import { toast } from 'react-toastify';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const waitTimeoutRef = useRef(null);

  const user = auth.currentUser;

  const RESPONSE_TIMEOUT_MS = 30000;

  const clearWaitTimeout = () => {
    if (waitTimeoutRef.current) {
      clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    // Cleanup on unmount, in case a message is in flight when the user navigates away
    return () => clearWaitTimeout();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
  if (!user) {
    return;
  }

  const chatsRef = collection(db, 'users', user.uid, 'chats');
  const q = query(chatsRef, orderBy('createTime', 'asc'));

  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);

      const last = msgs[msgs.length - 1];
      if (last?.response) {
        clearWaitTimeout();
        setIsWaiting(false);
      }
    },
    (error) => {
      toast.error('Lost connection to chat. Please refresh the page.');
    }
  );

  return () => unsubscribe();
}, [user]);
  const sendMessage = async () => {
  const text = inputValue.trim();
  if (!text || isWaiting || !user) return;

  setInputValue('');
  setIsWaiting(true);

  try {
    const chatsRef = collection(db, 'users', user.uid, 'chats');
    await addDoc(chatsRef, {
      prompt: text,
    });

    clearWaitTimeout();
    waitTimeoutRef.current = setTimeout(() => {
      setIsWaiting(false);
      toast.error("The assistant didn't respond in time. Please try again.");
    }, RESPONSE_TIMEOUT_MS);
  } catch (error) {
    toast.error('Failed to send message. Please try again.');
    setIsWaiting(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    'What departments do I need clearance from?',
    'How do I get library clearance?',
    'When can I collect my certificate?',
    'What happens if my document is declined?',
  ];

  return (
    <div className="chatbot-page">
      {/* Page Header */}
      <div className="chatbot-page-header">
        <div className="chatbot-page-header-left">
          <div className="chatbot-page-avatar">
            <FaRobot />
          </div>
          <div>
            <h1 className="chatbot-page-title">Smart Clearance Assistant</h1>
            <p className="chatbot-page-subtitle">
              <span className="chatbot-page-status-dot" />
              Ask me anything about your clearance process
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="chatbot-container">
        
        <div className="chatbot-messages-area">
         
          {messages.length === 0 && (
            <div className="chatbot-empty">
              <div className="chatbot-empty-icon">
                <FaRobot />
              </div>
              <h2 className="chatbot-empty-title">How can I help you today?</h2>
              <p className="chatbot-empty-text">
                I'm here to guide you through the Babcock University final clearance process.
                Select a question below or type your own.
              </p>
              <div className="chatbot-suggestions-grid">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="chatbot-suggestion-card"
                    onClick={() => {
                      setInputValue(q);
                      inputRef.current?.focus();
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          
          {messages.map((msg) => (
            <div key={msg.id} className="chatbot-message-pair">
              
              <div className="chatbot-message chatbot-message--user">
                <div className="chatbot-bubble chatbot-bubble--user">
                  {msg.prompt}
                </div>
                <div className="chatbot-msg-avatar chatbot-msg-avatar--user">
                  <FaUser />
                </div>
              </div>

              
              {msg.response ? (
                <div className="chatbot-message chatbot-message--bot">
                  <div className="chatbot-msg-avatar chatbot-msg-avatar--bot">
                    <FaRobot />
                  </div>
                  <div className="chatbot-bubble chatbot-bubble--bot">
                    {msg.response}
                  </div>
                </div>
              ) : (
                <div className="chatbot-message chatbot-message--bot">
                  <div className="chatbot-msg-avatar chatbot-msg-avatar--bot">
                    <FaRobot />
                  </div>
                  <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chatbot-input-bar">
          <div className="chatbot-input-wrapper">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder="Ask about your clearance process..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isWaiting}
            />
            <button
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isWaiting}
            >
              {isWaiting ? <FaSpinner className="spin" /> : <FaPaperPlane />}
              <span>{isWaiting ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
          <p className="chatbot-input-hint">
            Press <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
