import React, { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle } from 'lucide-react';

export default function VoiceChat({ onTranscriptionComplete, onCancel }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // --- NEW: Refs for audio recording ---
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      onCancel();
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone permission was denied. Please allow microphone access in your browser settings.");
      }
      setIsListening(false);
      onCancel();
    };
    
    // This now runs only when listening stops naturally
    recognitionRef.current.onend = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsListening(false);
    };

    // This is where we process the final result
    recognitionRef.current.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      
      // When transcription is ready, stop the audio recorder.
      // The onstop event for the recorder will handle sending the data.
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      
      // We will now pass the text to the recorder's onstop event handler
      // so we can package it with the audio.
      mediaRecorderRef.current.finalTranscript = text;
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCancel]);

  const startListening = async () => {
    try {
      // Get microphone permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // --- NEW: Audio recording logic ---
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const audioDataUri = reader.result;
          const transcript = mediaRecorderRef.current.finalTranscript;

          // Call the parent with an object containing BOTH text and audio
          if (transcript && audioDataUri) {
            onTranscriptionComplete({ transcript, audioDataUri });
          }
        };
         // Clean up the microphone stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Start both recording and recognition
      mediaRecorderRef.current.start();
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please grant permission and try again.");
      onCancel();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };
  
  return (
    <div className="voice-input-panel">
      {isListening ? (
        <div className="listening-state">
          <p>Listening...</p>
          <button className="button danger" onClick={stopListening}>
            <StopCircle size={20} />
          </button>
        </div>
      ) : (
        <div className="voice-actions">
          <button className="button primary icon-button" onClick={startListening} title="Start voice input">
            <Mic size={24} />
          </button>
          <button className="button secondary" onClick={onCancel}>
            Switch to Text
          </button>
        </div>
      )}
    </div>
  );
}