"use client";

import { useState } from "react";
import { generateResponse } from "../actions/gemini";
import { useGeminiLive } from "../hooks/use-gemini-live";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleVoiceResponse = (text: string) => {
      setMessages((prev) => [...prev, { role: "ai", content: text }]);
  };

  const { isRecording, isPlaying, error: voiceError, startRecording, stopRecording } = useGeminiLive(handleVoiceResponse);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const { text, error } = await generateResponse(userMessage);

    setLoading(false);
    if (text) {
      setMessages((prev) => [...prev, { role: "ai", content: text }]);
    } else {
      setMessages((prev) => [...prev, { role: "ai", content: "Error: " + error }]);
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba de Chatbot Gemini</h1>
      
      {voiceError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error de voz: {voiceError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && !isRecording && (
          <p className="text-center text-gray-500 mt-10">¡Comienza una conversación!</p>
        )}
        
        {isRecording && (
          <div className="text-center p-4 bg-blue-50 rounded-lg animate-pulse">
            <p className="text-blue-600 font-bold">
              {isPlaying ? "Gemini hablando..." : "Escuchando..."}
            </p>
            <p className="text-xs text-blue-400 mt-1">(Respuestas de voz solo audio)</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.role === "user"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-white text-black border self-start"
            }`}
          >
            <strong>{msg.role === "user" ? "Tú" : "Gemini"}:</strong>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {loading && <div className="text-gray-500 italic">Pensando...</div>}
      </div>
      
      <div className="flex gap-2 items-center">
        <button
          onClick={toggleVoice}
          className={`p-3 rounded-full ${
            isRecording 
              ? "bg-red-500 hover:bg-red-600 animate-pulse" 
              : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700"
          }`}
          title={isRecording ? "Detener voz" : "Iniciar voz"}
        >
          {isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-200"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          )}
        </button>

        <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            disabled={loading || isRecording}
          />
          <button
            type="submit"
            disabled={loading || isRecording}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
