import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';

// --- Trying import without extension again, matching App.jsx ---
import { AuthContext } from '../context/AuthContext';

// --- CSS Styles ---
// Added styles for .language-selector
const chatbotStyles = `
    /* CSS provided by the user */
    .chat-container {
        position: fixed; /* Changed to fixed */
        bottom: 20px;    /* Position at the bottom */
        right: 20px;     /* Position at the right */
        z-index: 1000;   /* Stay on top of other content */
        background: rgba(255, 255, 255, 0.2);
        border-radius: 25px;
        backdrop-filter: blur(15px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 400px; /* Made it a bit smaller for a popup */
        height: 60vh;      /* Adjusted height */
        max-height: 500px; /* Max height */
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease; /* Added opacity transition */
        font-family: 'Poppins', sans-serif;
    }
    .chat-container:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    }
    .chat-header {
        background: linear-gradient(45deg, #F5BABB, #B568F8);
        color: #FFF5F2;
        padding: 0.75rem 1.25rem; /* Adjusted padding */
        display: flex;
        /* justify-content: space-between; */ /* Let items flow naturally */
        align-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        cursor: grab; /* Added for clarity that it's a popup */
    }
    .chat-header h1 {
        font-size: 1.1rem; /* Adjusted font size */
        font-weight: 600;
        margin: 0;
        margin-right: 10px; /* Space between title and select */
        white-space: nowrap; /* Prevent title wrapping */
    }
    /* --- Styles for Language Selector --- */
     .language-selector {
        background-color: rgba(255, 255, 255, 0.2);
        color: #FFF5F2;
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        padding: 4px 8px;
        font-size: 0.8rem;
        cursor: pointer;
        outline: none;
        margin-right: 10px; /* Space between select and status */
     }
     .language-selector option {
        background-color: #B568F8; /* Match header gradient */
        color: #FFF5F2;
     }
    #bot-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto; /* Push status to the far right */
        white-space: nowrap; /* Prevent status wrapping */
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
        flex-shrink: 0; /* Prevent dot from shrinking */
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
        padding: 1rem; /* Adjusted padding */
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
        padding: 1rem; /* Adjusted padding */
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
        text-decoration: none;
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

    /* --- Chatbot Visibility Toggle --- */
    .chat-toggle-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1001; /* Above the chat window */
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
        /* Updated animation for hiding */
        transform: scale(0.8) translateY(50px) translateX(50px);
        opacity: 0;
        pointer-events: none;
    }
`;

// --- SVG Icons ---
// ... (Keep existing SVG Icon components) ...
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
// --- End SVG Icons ---

// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop listening after first pause
    // recognition.lang will be set dynamically
    recognition.interimResults = false; // Process final result only
}

// --- Text-to-Speech Setup ---
const speakText = (text, setStatus, botStatusRef) => { // Pass botStatusRef
    if (!window.speechSynthesis || !text) return; // Add check for empty text
    const utterance = new SpeechSynthesisUtterance(text);

    // Simple language detection for TTS voice
    if (/[\u0900-\u097F]/.test(text)) { // Hindi characters
        utterance.lang = 'hi-IN';
    } else if (/[\u0C00-\u0C7F]/.test(text)) { // Telugu characters
        utterance.lang = 'te-IN';
    } else { // Default to English
        utterance.lang = 'en-US';
    }

    // Ensure status is updated correctly, even if speech ends quickly
    let speaking = false;
    utterance.onstart = () => {
        speaking = true;
        setStatus({ text: 'Speaking', dot: 'status-speaking' });
    }
    utterance.onend = () => {
        speaking = false;
        // Check if another speech has started before setting to idle
        // Also check if the user manually stopped it (ref might be Idle already)
        if (!window.speechSynthesis.speaking && botStatusRef.current.text !== 'Idle') {
            setStatus({ text: 'Idle', dot: 'status-idle' });
        }
    }
    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error:", event.error);
        speaking = false;
        setStatus({ text: 'Idle', dot: 'status-idle' }); // Reset status on error
    };

    window.speechSynthesis.cancel(); // Cancel any previous speech
    // Add small delay before speaking to allow cancel to work reliably
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
};


// --- The React Component ---
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

    // 🔥 STEP 4: REMOVE selectedLanguage state. This line is deleted.
    // const [selectedLanguage, setSelectedLanguage] = useState('en-US'); // Default to English 

    // NEW: Ref to keep track of bot status for TTS onend handler
    const botStatusRef = useRef(botStatus);
    useEffect(() => {
        botStatusRef.current = botStatus;
    }, [botStatus]);


    // GET THE TOKEN FROM CONTEXT
    const { token } = useContext(AuthContext);

    // Your server is running on port 5000
    const backendApiUrl = 'https://statelevel-backend.onrender.com/api/chat';


    // Inject CSS into the document head
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.id = 'chatbot-styles';
        styleElement.innerHTML = chatbotStyles;
        document.head.appendChild(styleElement);
        return () => {
            const existingStyleElement = document.getElementById('chatbot-styles');
            if (existingStyleElement) document.head.removeChild(existingStyleElement);
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTo({
                top: chatWindowRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // Greet user on first open & handle closing
    useEffect(() => {
        if (isOpen && messages.length === 1) {
            setTimeout(() => {
                // Pass botStatusRef to speakText
                speakText("Hello! I am your AI Mart assistant.", setBotStatus, botStatusRef);
            }, 500);
        }
        return () => { // Cleanup when isOpen changes or component unmounts
            if (!isOpen) { // If closing the chat window
                window.speechSynthesis.cancel(); // Stop any ongoing speech
                if (recognition && isListening) { // Stop listening if active
                    try { recognition.abort(); } catch(e){}
                    setIsListening(false);
                }
                // Reset status immediately on close, unless it was already Idle
                 if (botStatusRef.current.text !== 'Idle') {
                    setBotStatus({ text: 'Idle', dot: 'status-idle' });
                }
            }
        };
        // Pass botStatusRef to speakText in dependencies if needed, but likely not
    }, [isOpen, messages.length, isListening]); // Added isListening to dependencies

      // STOP-speaking phrases (typed or spoken). include English, Hindi, Telugu variants
    const STOP_PHRASES = new Set([
        'stop', 'stop speaking', 'end', 'end speaking', 'quit', 'stop please', 'please stop',
        'chup', 'chup raho', 'ruk jao', // Hindi casual
        'nenu nilabettanu', // Telugu (example)
        'matladaku', 'oceanunu', 'ఆపు మాట్లాడటం', 'ఆపు', 'మాట్లాడకండి', // Telugu variants
        'चुप रहो', 'बंद करो', 'बोलना बंद करो' // Hindi variants
    ].map(s => s.toLowerCase()));
    
    // --- Speech Recognition Handlers ---
    // 🔥 STEP 2: startListening() is REPLACED
    const startListening = () => {
        if (!recognition || isListening || isLoading) return;

        // AUTO DETECT START: Try Telugu → Hindi → English
        const possibleLangs = ["te-IN", "hi-IN", "en-US"];

        recognition.lang = possibleLangs[0]; // Begin with Telugu

        console.log("🎤 Auto-language detection mode activated...");

        try {
            recognition.start();
            setIsListening(true);
            setBotStatus({ text: "Listening...", dot: "status-speaking" });
        } catch (e) {
            console.error("Error starting recognition:", e);
            setIsListening(false);
            setBotStatus({ text: "Idle", dot: "status-idle" });
        }
    };


    const stopListening = useCallback(() => {
        if (!recognition || !isListening) return;
        try { recognition.stop(); }
        catch(e) { console.warn("Recognition stop error:", e); }
        finally {
            setIsListening(false);
            // Use ref here as state might be stale
            if (!isLoading && botStatusRef.current.text !== 'Thinking') {
                setBotStatus({ text: 'Idle', dot: 'status-idle' });
            }
        }
    }, [recognition, isListening, isLoading]); // isLoading needed

    // --- Chat Send Handler ---
    const handleSend = useCallback(async (messageText = null) => {
        const text = (typeof messageText === 'string' ? messageText.trim() : input.trim());
        if (text === '' || isLoading) return;

        // --- NEW: Handle "stop speaking" command ---
        const lowerCaseText = text.toLowerCase();
        // Added Telugu command - adjust if needed
        const stopCommands = ['stop speaking', 'chup raho', 'matladaku', 'ఆపు మాట్లాడటం']; // Added Telugu
        if (stopCommands.includes(lowerCaseText)) {
            console.log("Stop speaking command received.");
            window.speechSynthesis.cancel(); // Stop TTS
            setBotStatus({ text: 'Idle', dot: 'status-idle' }); // Update status
            // Only clear input if command was typed, not spoken
            if (messageText === null) {
                setInput('');
            }
            // Optionally add a confirmation message
            // setMessages(prev => [...prev, { sender: 'bot', text: "Okay, I've stopped speaking." }]);
            return; // Exit without sending to backend
        }
        // --- End Stop Speaking Logic ---

        if (messageText === null) setInput(''); // Clear typed input

        setMessages(prev => [...prev, { sender: 'user', text }]);
        setIsLoading(true);
        setBotStatus({ text: 'Thinking', dot: 'status-thinking' });
        window.speechSynthesis.cancel(); // Cancel previous speech before new request

        try {
            if (!token) throw new Error('Authentication token is missing. Please log in.');

            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: text })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                let errorBody = `Server error ${response.status}`;
                try { const errorJson = await response.json(); errorBody = errorJson.error || JSON.stringify(errorJson); }
                catch { try { errorBody = await response.text(); } catch {} }
                console.error(`Server Error ${response.status}: ${errorBody}`);
                throw new Error(errorBody);
            }

            const data = await response.json();
            const botResponse = data?.reply || "I received a response, but couldn't understand it.";

            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
            // Pass botStatusRef to speakText
            speakText(botResponse, setBotStatus, botStatusRef);

        } catch (error) {
            console.error("Error fetching/processing backend:", error);
            let errorMsg = "An unexpected error occurred.";
             if (error.message.includes('Authentication') || error.message.includes('token is missing')) {
                 errorMsg = 'Authentication failed. Please log in again.';
            } else if (error.message.includes('Failed to fetch')) {
                 errorMsg = "Sorry, I couldn't connect to the server. Is it running?";
            } else { errorMsg = `Error: ${error.message}`; }

            setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
            // Pass botStatusRef to speakText
            speakText(errorMsg, setBotStatus, botStatusRef); // Speak the error
        } finally {
            setIsLoading(false);
            // TTS onend handler will manage Idle status, unless it failed to start
            if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                 // Use ref to check status before resetting
                 setBotStatus(prevStatus => prevStatus.text === 'Speaking' ? prevStatus : { text: 'Idle', dot: 'status-idle' });
            }
        }
    }, [input, token, backendApiUrl, isLoading, /* Dependencies for state setters */ setMessages, setInput, setIsLoading, setBotStatus ]);

    // Setup recognition event handlers
    useEffect(() => {
        if (!recognition) return;

        const handleResult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) { transcript += event.results[i][0].transcript; }
            }
            transcript = transcript.trim();
            
            // 🔥 STEP 3: handleResult content is REPLACED
            if (transcript) {
                console.log("Voice Transcript:", transcript);

                // --- AUTO LANGUAGE DETECTION ---
                let detectedLang = "en-US";

                if (/[\u0C00-\u0C7F]/.test(transcript)) {
                    detectedLang = "te-IN"; // Telugu (Unicode block)
                } else if (/[\u0900-\u097F]/.test(transcript)) {
                    detectedLang = "hi-IN"; // Hindi (Devanagari Unicode block)
                }

                console.log("🌐 Detected Language:", detectedLang);

                // Switch speech recognition engine to detected language
                // This will apply for the *next* time listening starts, which is the desired effect
                recognition.lang = detectedLang;

                setInput(transcript);
                handleSend(transcript);
            }
            // Stop listening is handled by 'end' event
        };

        const handleError = (event) => {
            console.error("Speech recognition error:", event.error, event.message);
            let errorFeedback = `Voice recognition error: ${event.error}.`;
            if (event.error === 'no-speech') errorFeedback = "I didn't hear anything. Try speaking again.";
            else if (event.error === 'audio-capture') errorFeedback = "Couldn't access microphone. Check permissions.";
            else if (event.error === 'not-allowed') errorFeedback = "Microphone access denied. Allow access in browser settings.";
            else if (event.error === 'network') errorFeedback = "Network error during voice recognition.";

            setMessages(prev => [...prev, { sender: 'bot', text: errorFeedback }]);
            stopListening(); // Ensure stop on error
        };

        const handleEnd = () => {
            console.log("Speech recognition ended.");
            // This ensures state is updated even if stopListening wasn't triggered elsewhere
            if (isListening) { stopListening(); }
        };

        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', handleEnd);

        return () => { // Cleanup
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('error', handleError);
            recognition.removeEventListener('end', handleEnd);
            if (isListening) {
                try { recognition.abort(); } catch(e){}
                 setIsListening(false);
                 // Ensure status resets correctly if unmounting while listening
                 setBotStatus(prev => prev.text === 'Listening...' ? { text: 'Idle', dot: 'status-idle' } : prev);
            }
        };
    }, [isListening, stopListening, handleSend]); // handleSend needed as it's called in handleResult

    return (
        <>
            {/* --- Chat Toggle Button --- */}
            <button
                className="chat-toggle-button"
                onClick={() => setIsOpen(!isOpen)}
                title="Toggle AI Chat"
                aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>

            {/* --- Chat Window --- */}
            <div
                className={`chat-container ${isOpen ? '' : 'hidden'}`}
                aria-hidden={!isOpen}
            >
                <header className="chat-header">
                    <h1>AI Mart Assistant</h1>
                    {/* 🔥 STEP 1: REMOVED the language selector UI here! */}
                    
                    <div id="bot-status" aria-live="polite">
                        <span id="bot-status-text">{botStatus.text}</span>
                        <div id="bot-status-dot" className={botStatus.dot}></div>
                    </div>
                </header>

                <div
                    id="chat-window"
                    className="chat-window"
                    ref={chatWindowRef}
                    role="log"
                    aria-relevant="additions text"
                    >
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.sender}`} role="listitem">
                            <div>
                                <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="chat-footer">
                    {/* Loading Indicator */}
                    {isLoading && (
                        <div id="loading-indicator" role="status" aria-live="polite">
                            <div className="spinner" aria-hidden="true"></div>
                            <span>AI is thinking...</span>
                        </div>
                    )}
                    {/* Input Row */}
                    <div className="input-row">
                        {/* Mic Button */}
                        <button
                            id="mic-button"
                            className={`chat-btn ${isListening ? 'is-listening' : ''}`}
                            // The title no longer shows a "selected language" as it auto-detects dynamically
                            title={isListening ? "Stop listening" : `Ask with voice (Auto-Detect)`}
                            aria-label={isListening ? "Stop listening" : "Ask with voice"}
                            onClick={isListening ? stopListening : startListening}
                            disabled={!recognition || isLoading} // Disable if speech not supported or AI is thinking
                        >
                            <MicIcon />
                        </button>
                        {/* Text Input */}
                        <input
                            type="text"
                            id="chat-input"
                            aria-label="Chat message input"
                             // NEW: Updated placeholder
                            placeholder="Type 'stop speaking' or use mic..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                                    e.preventDefault();
                                    handleSend(null); // Explicitly pass null for typed messages
                                }
                            }}
                            disabled={isLoading}
                        />
                        {/* Send Button */}
                        <button
                            id="send-button"
                            className="chat-btn"
                            title="Send message"
                            aria-label="Send message"
                            onClick={() => handleSend(null)} // Explicitly pass null for button click
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