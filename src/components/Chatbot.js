import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

// --- CSS Styles ---
const chatbotStyles = `
    .chat-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 25px;
        backdrop-filter: blur(15px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 400px;
        height: 60vh;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
        font-family: 'Poppins', sans-serif;
    }
    .chat-container:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    }
    .chat-header {
        background: linear-gradient(45deg, #F5BABB, #B568F8);
        color: #FFF5F2;
        padding: 0.75rem 1.25rem;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        cursor: grab;
    }
    .chat-header h1 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        white-space: nowrap;
    }
    #bot-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto;
        white-space: nowrap;
    }
    #bot-status span {
        font-size: 0.875rem;
    }
    #bot-status div {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #FFF5F2;
        opacity: 0.7;
        flex-shrink: 0;
    }
    #bot-status div.status-idle { background: #9ca3af; }
    #bot-status div.status-thinking { background: #f59e0b; animation: pulse 1.5s infinite; }
    #bot-status div.status-speaking { background: #10b981; animation: pulse 1.5s infinite; }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
    .chat-window {
        flex-grow: 1;
        padding: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.1);
    }
    .chat-window::-webkit-scrollbar { width: 6px; }
    .chat-window::-webkit-scrollbar-track { background: transparent; }
    .chat-window::-webkit-scrollbar-thumb { background: #F5BABB; border-radius: 3px; }
    .chat-window::-webkit-scrollbar-thumb:hover { background: #B568F8; }
    .chat-message {
        display: flex;
        max-width: 80%;
    }
    .chat-message.user {
        justify-content: flex-end;
        margin-left: auto;
    }
    .chat-message.bot {
        justify-content: flex-start;
        margin-right: auto;
    }
    .chat-message div {
        padding: 0.75rem 1rem;
        border-radius: 18px;
        font-size: 0.95rem;
        line-height: 1.5;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .chat-message div p {
        margin: 0;
    }
    .chat-message.user div {
        background: #B568F8;
        color: white;
        border-bottom-right-radius: 4px;
    }
    .chat-message.bot div {
        background: #ffffff;
        color: #064232;
        border-bottom-left-radius: 4px;
    }
    .chat-footer {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.2);
        border-top: 1px solid rgba(255, 255, 255, 0.3);
    }
    #loading-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #B568F8;
        margin-bottom: 0.5rem;
        padding-left: 0.5rem;
    }
    #loading-indicator .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #F5BABB;
        border-top-color: #B568F8;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .input-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }
    #chat-input {
        flex-grow: 1;
        padding: 0.7rem 1rem;
        border-radius: 12px;
        border: 2px solid #F5BABB;
        outline: none;
        font-size: 1rem;
        font-family: 'Poppins', sans-serif;
        transition: border 0.3s ease, box-shadow 0.3s ease;
    }
    #chat-input:focus {
        border-color: #B568F8;
        box-shadow: 0 0 10px rgba(181, 104, 248, 0.5);
    }
    .chat-btn {
        padding: 0.7rem;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(45deg, #F5BABB, #B568F8);
        color: #FFF5F2;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.4s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        animation: coralGlow 1.5s ease-in-out infinite alternate;
    }
    @keyframes coralGlow {
        0% { box-shadow: 0 0 5px #FF7F50, 0 0 10px #FF7F50; }
        100% { box-shadow: 0 0 15px #FF7F50, 0 0 20px #FF7F50; }
    }
    .chat-btn:hover {
        transform: translateY(-2px);
    }
    .chat-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        animation: none;
        transform: none;
    }
    .chat-btn svg {
        width: 24px;
        height: 24px;
        stroke-width: 2;
    }
    #mic-button.is-listening {
       background: linear-gradient(45deg, #ff4d4d, #ff8c8c);
       animation: none;
       animation: pulse-red 1.2s infinite;
    }
    @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
    }
    .chat-toggle-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1001;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(45deg, #F5BABB, #B568F8);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        animation: coralGlow 1.5s ease-in-out infinite alternate;
    }
    .chat-toggle-button:hover {
        transform: scale(1.1) translateY(-3px);
    }
    .chat-toggle-button svg {
        width: 32px;
        height: 32px;
    }
    .chat-container.hidden {
        transform: scale(0.8) translateY(50px) translateX(50px);
        opacity: 0;
        pointer-events: none;
    }
`;

// --- SVG Icons ---
const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c-3.314 0-6-2.686-6-6v-1.5a6 6 0 1112 0v1.5c0 3.314-2.686 6-6 6z" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.875L5.999 12zm0 0h7.5" />
    </svg>
);

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 01-1.06 0l-3.72-3.72H6.31c-1.136 0-1.98-.967-1.98-2.193v-4.286c0-.97.616-1.813 1.5-2.097m14.25 0a2.25 2.25 0 00-2.25-2.25H6.31a2.25 2.25 0 00-2.25 2.25m14.25 0H18v-3.09c0-.621-.504-1.125-1.125-1.125H9.125C8.504 4.29 8 4.794 8 5.415v3.09m12.25 0c.377.013.75.057.998.139m-15.002 0A2.25 2.25 0 015.625 8.13l-.221-.03c-.126-.017-.248-.031-.368-.042" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
}

// --- Text-to-Speech ---
const speakText = (text, setStatus, botStatusRef) => {
    if (!window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);

    if (/[\u0900-\u097F]/.test(text)) {
         utterance.lang = 'hi-IN';
    } else if (/[\u0C00-\u0C7F]/.test(text)) {
         utterance.lang = 'te-IN';
    } else {
         utterance.lang = 'en-US';
    }

    let speaking = false;
    utterance.onstart = () => {
         speaking = true;
         setStatus({ text: 'Speaking', dot: 'status-speaking' });
    };
    utterance.onend = () => {
         speaking = false;
         if (!window.speechSynthesis.speaking && botStatusRef.current.text !== 'Idle') {
             setStatus({ text: 'Idle', dot: 'status-idle' });
         }
    };
    utterance.onerror = (event) => {
         console.error("SpeechSynthesis Error:", event.error);
         setStatus({ text: 'Idle', dot: 'status-idle' });
    };

    window.speechSynthesis.cancel();
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
};

// --- Main Component ---
const Chatbot = () => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hello! Ask me about your inventory in English." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [botStatus, setBotStatus] = useState({ text: 'Idle', dot: 'status-idle' });
    const [isOpen, setIsOpen] = useState(false);
    const chatWindowRef = useRef(null);
    const botStatusRef = useRef(botStatus);

    const { token } = useContext(AuthContext);
    const backendApiUrl = 'https://statelevel-backend.onrender.com/api/chat';

    useEffect(() => {
        botStatusRef.current = botStatus;
    }, [botStatus]);

    // Inject CSS
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'chatbot-styles';
        style.innerHTML = chatbotStyles;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById('chatbot-styles');
            if (el) document.head.removeChild(el);
        };
    }, []);

    // Auto scroll
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTo({
                top: chatWindowRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // Greet on open
    useEffect(() => {
        if (isOpen && messages.length === 1) {
            setTimeout(() => {
                speakText("Hello! I am your AI Mart assistant.", setBotStatus, botStatusRef);
            }, 500);
        }
        return () => {
            if (!isOpen) {
                window.speechSynthesis.cancel();
                if (recognition && isListening) recognition.abort();
            }
        };
    }, [isOpen, messages.length]);

    // START LISTENING WITH AUTO DETECTION
    const startListening = () => {
        if (!recognition || isListening || isLoading) return;

        recognition.lang = "te-IN"; // Start with Telugu (will auto-switch on result)

        console.log("Auto-language detection mode activated...");

        try {
            recognition.start();
            setIsListening(true);
            setBotStatus({ text: "Listening...", dot: "status-speaking" });
        } catch (e) {
            console.error("Error starting recognition:", e);
            setIsListening(false);
            setBotStatus({ text: 'Idle', dot: 'status-idle' });
        }
    };

    const stopListening = useCallback(() => {
        if (!recognition || !isListening) return;
        try { recognition.stop(); } catch(e) {}
        setIsListening(false);
        if (!isLoading && botStatusRef.current.text !== 'Thinking') {
            setBotStatus({ text: 'Idle', dot: 'status-idle' });
        }
    }, [isLoading]);

    const handleSend = useCallback(async (messageText = null) => {
        const text = (typeof messageText === 'string' ? messageText.trim() : input.trim());
        if (text === '' || isLoading) return;

        const lower = text.toLowerCase();
        if (['stop', 'stop speaking', 'chup', 'chup raho', 'matladaku', 'ఆపు', 'ఆపు మాట్లాడటం'].some(cmd => lower.includes(cmd))) {
            window.speechSynthesis.cancel();
            setBotStatus({ text: 'Idle', dot: 'status-idle' });
            if (messageText === null) setInput('');
            return;
        }

        if (messageText === null) setInput('');
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setIsLoading(true);
        setBotStatus({ text: 'Thinking', dot: 'status-thinking' });
        window.speechSynthesis.cancel();

        try {
            if (!token) throw new Error('Authentication token is missing.');

            const res = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: text })
            });

            if (!res.ok) throw new Error(`Server error ${res.status}`);

            const data = await res.json();
            const botReply = data?.reply || "Sorry, I didn't understand the response.";

            setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
            speakText(botReply, setBotStatus, botStatusRef);

        } catch (err) {
            console.error(err);
            const errMsg = err.message.includes('token') ? 'Please log in again.' : 'Server error, try again.';
            setMessages(prev => [...prev, { sender: 'bot', text: errMsg }]);
            speakText(errMsg, setBotStatus, botStatusRef);
        } finally {
            setIsLoading(false);
        }
    }, [input, token, isLoading]);

    // Speech Recognition Events
    useEffect(() => {
        if (!recognition) return;

        const handleResult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                }
            }
            transcript = transcript.trim();
            if (!transcript) return;

            console.log("Voice Transcript:", transcript);

            // AUTO LANGUAGE DETECTION
            let detectedLang = "en-US";
            if (/[\u0C00-\u0C7F]/.test(transcript)) {
                detectedLang = "te-IN";
            } else if (/[\u0900-\u097F]/.test(transcript)) {
                detectedLang = "hi-IN";
            }
            console.log("Detected Language:", detectedLang);

            // Switch engine to detected language for better accuracy next time
            recognition.lang = detectedLang;

            setInput(transcript);
            handleSend(transcript);
        };

        const handleError = (event) => {
            console.error("Speech error:", event.error);
            stopListening();
        };

        const handleEnd = () => {
            if (isListening) stopListening();
        };

        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', handleEnd);

        return () => {
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('error', handleError);
            recognition.removeEventListener('end', handleEnd);
        };
    }, [isListening, stopListening, handleSend]);

    return (
        <>
            <button
                className="chat-toggle-button"
                onClick={() => setIsOpen(!isOpen)}
                title="Toggle AI Chat"
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>

            <div className={`chat-container ${isOpen ? '' : 'hidden'}`}>
                <header className="chat-header">
                    <h1>AI Mart Assistant</h1>
                    <div id="bot-status" aria-live="polite">
                        <span>{botStatus.text}</span>
                        <div className={botStatus.dot}></div>
                    </div>
                </header>

                <div id="chat-window" className="chat-window" ref={chatWindowRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-message ${msg.sender}`}>
                            <div>
                                <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="chat-footer">
                    {isLoading && (
                        <div id="loading-indicator">
                            <div className="spinner"></div>
                            <span>AI is thinking...</span>
                        </div>
                    )}
                    <div className="input-row">
                        <button
                            id="mic-button"
                            className={`chat-btn ${isListening ? 'is-listening' : ''}`}
                            title={isListening ? "Stop" : "Speak (auto-detect language)"}
                            onClick={isListening ? stopListening : startListening}
                            disabled={!recognition || isLoading}
                        >
                            <MicIcon />
                        </button>
                        <input
                            type="text"
                            id="chat-input"
                            placeholder="Type or speak..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <button
                            className="chat-btn"
                            onClick={() => handleSend()}
                            disabled={isLoading || input.trim() === ''}
                        >
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default Chatbot;