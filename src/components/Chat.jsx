import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble.jsx';
import VoiceChat from './VoiceChat.jsx';
import { Mic, Send } from 'lucide-react';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

// --- Define both of your webhook URLs here ---
const VOICE_WEBHOOK_URL = 'https://rayanghosh73.app.n8n.cloud/webhook-test/voice-mood-analysis';
const TEXT_WEBHOOK_URL = 'https://rayanghosh73.app.n8n.cloud/webhook/0e80e6c0-cde2-4314-a073-8a38a856332f';

export default function Chat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [isBotReplying, setIsBotReplying] = useState(false);
  const viewportRef = useRef(null);

  // Fetch messages in real-time
  useEffect(() => {
    if (!currentUser) return;
    const messagesCollectionRef = collection(db, 'users', currentUser.uid, 'chats');
    const q = query(messagesCollectionRef, orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (msgs.length === 0) {
        setMessages([{ id: 'm1', role: 'bot', text: 'Welcome! How can I help today? You can type or use the mic.' }]);
      } else {
        setMessages(msgs);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  // Save message to Firestore
  async function addMessage(text, role) {
    if (!text.trim() || !currentUser) return;
    const messagesCollectionRef = collection(db, 'users', currentUser.uid, 'chats');
    await addDoc(messagesCollectionRef, {
      role,
      text,
      createdAt: serverTimestamp()
    });
  }

  // Send message to correct webhook
  const sendMessage = async (text, inputType, audioDataUri = null) => {
    const userMessage = text.trim();
    if (!userMessage || isBotReplying) return;

    addMessage(userMessage, 'user');
    setDraft('');
    setIsBotReplying(true);

    const webhookUrl = inputType === 'voice' ? VOICE_WEBHOOK_URL : TEXT_WEBHOOK_URL;
    
    // Build request body
    let requestBody = { 
      text: userMessage, 
      sessionId: currentUser?.uid || "guest" 
    }; 
    if (inputType === 'voice' && audioDataUri) {
      requestBody = { 
        transcript: userMessage, 
        audioDataUri: audioDataUri, 
        sessionId: currentUser?.uid || "guest" 
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Webhook responded with status: ${response.status}`);
      
      const data = await response.json();

      // ✅ Flexible handling: check both responseText and output
      const reply =
        data.responseText ||            // if webhook sends { responseText: "..." }
        data.output ||                  // if webhook sends { output: "..." }
        (Array.isArray(data) && data[0]?.output); // if webhook sends [ { output: "..." } ]

      if (reply) {
        addMessage(reply, 'bot');
      } else {
        addMessage("Sorry, I received an unexpected response.", 'bot');
        console.error("Unexpected response format from n8n:", data);
      }
    } catch (error) {
      console.error("Error communicating with webhook:", error);
      addMessage("Sorry, I'm having trouble connecting right now.", 'bot');
    } finally {
      setIsBotReplying(false);
    }
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(draft, 'text');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(draft, 'text');
    }
  };

  const handleVoiceInput = (voiceData) => {
    if (voiceData && voiceData.transcript && voiceData.audioDataUri) {
      sendMessage(voiceData.transcript, 'voice', voiceData.audioDataUri);
    }
    setInputMode('text');
  };

  return (
    <div className="chat-container">
      <div className="chat" ref={viewportRef}>
        {messages.map(m => <MessageBubble key={m.id} role={m.role} text={m.text} />)}
        {isBotReplying && <MessageBubble role="bot" text="..." isLoading={true} />}
      </div>
      <div className="input-panel">
        {inputMode === 'text' ? (
          <form className="form" onSubmit={handleFormSubmit}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isBotReplying ? "Juvo is replying..." : "Message Juvo…"}
              disabled={isBotReplying}
            />
            <button className="button send" type="submit" disabled={isBotReplying}><Send size={18} /></button>
            <button type="button" className="button small icon-button" onClick={() => setInputMode('voice')} disabled={isBotReplying}><Mic size={20} /></button>
          </form>
        ) : (
          <VoiceChat onTranscriptionComplete={handleVoiceInput} onCancel={() => setInputMode('text')} />
        )}
      </div>
    </div>
  );
}
