import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// NOTE: In a real app, do not expose API key on client. Use a proxy or ephemeral tokens.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
// Modelo correcto para Live API con audio
const model = "gemini-2.0-flash-live-001";

export function useGeminiLive(onTextReceived?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  // AudioContext separado para captura (usa sample rate nativo del navegador)
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      // No forzamos sample rate - dejamos que use el nativo del sistema
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Context separado para playback a 24kHz (output de Gemini)
    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
  }, []);

  const playNextChunk = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const chunk = audioQueueRef.current.shift()!;
    const audioCtx = playbackContextRef.current!;

    // Safety check if context is closed
    if (!audioCtx || audioCtx.state === 'closed') return;

    // Resume context if suspended (required for user interaction policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const buffer = audioCtx.createBuffer(1, chunk.length, 24000);

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < chunk.length; i++) {
      channelData[i] = chunk[i] / 32768;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    const currentTime = audioCtx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);

    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextChunk();
    };
  }, []);

  const connectToGemini = useCallback(async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        setError(null);
        const ai = new GoogleGenAI({ apiKey });
        
        const config = {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede", // Voz disponible
              },
            },
          },
          systemInstruction: {
            parts: [{ text: "Eres un asistente útil. Responde siempre en español de forma concisa." }],
          },
        };

        console.log("Conectando a Gemini Live...");
        
        const session = await ai.live.connect({
          model,
          config,
          callbacks: {
            onopen: () => {
              console.log("✅ Gemini Live Connected");
              isConnectedRef.current = true;
              resolve(true);
            },
            onmessage: (message: LiveServerMessage) => {
              const serverContent = message.serverContent;
              if (serverContent?.modelTurn?.parts) {
                for (const part of serverContent.modelTurn.parts) {
                  // Procesar audio
                  if (part.inlineData && part.inlineData.mimeType?.startsWith("audio/pcm")) {
                    const base64 = part.inlineData.data;
                    if (base64) {
                      const binaryString = atob(base64);
                      const len = binaryString.length;
                      const bytes = new Int16Array(len / 2);
                      for (let i = 0; i < len; i += 2) {
                        bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
                      }
                      audioQueueRef.current.push(bytes);
                      if (!isPlayingRef.current) {
                        playNextChunk();
                      }
                    }
                  }
                  // Procesar texto (si viene transcripción)
                  if (part.text && onTextReceived) {
                    onTextReceived(part.text);
                  }
                }
              }
              // También verificar si hay transcripción en el turno completado
              if (serverContent?.turnComplete) {
                console.log("Turn complete");
              }
            },
            onclose: (e: any) => {
              console.log("Gemini Live Closed", e);
              isConnectedRef.current = false;
            },
            onerror: (e: any) => {
              console.error("❌ Gemini Live Error", e);
              isConnectedRef.current = false;
              setError(e?.message || "Error de conexión con Gemini");
              resolve(false);
            },
          },
        });
        sessionRef.current = session;
        console.log("Session creada:", session);
      } catch (err: any) {
        console.error("Error conectando:", err);
        setError(err?.message || "Error al conectar con Gemini Live API");
        resolve(false);
      }
    });
  }, [playNextChunk, onTextReceived]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      initializeAudioContext();
      const audioCtx = audioContextRef.current!;
      const playbackCtx = playbackContextRef.current!;

      // Resume both contexts if suspended
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      if (playbackCtx.state === "suspended") {
        await playbackCtx.resume();
      }
      
      // Reiniciar referencia de tiempo para playback
      nextStartTimeRef.current = playbackCtx.currentTime;
      audioQueueRef.current = [];

      // Primero conectar a Gemini y esperar a que esté listo
      const connected = await connectToGemini();
      
      if (!connected) {
        throw new Error("No se pudo establecer conexión con Gemini");
      }

      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      mediaStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current || !isConnectedRef.current) return;
        
        // 1. Obtener datos del micrófono
        const inputData = e.inputBuffer.getChannelData(0);

        // 2. Downsampling (sample rate del navegador -> 16kHz)
        const inputSampleRate = audioCtx.sampleRate;
        const targetSampleRate = 16000;
        let pcmData: Int16Array;

        if (inputSampleRate !== targetSampleRate) {
          const ratio = inputSampleRate / targetSampleRate;
          const newLength = Math.floor(inputData.length / ratio);
          pcmData = new Int16Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const offset = Math.floor(i * ratio);
            let s = Math.max(-1, Math.min(1, inputData[offset]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
        } else {
          pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
        }

        // 3. Convertir a Base64
        const buffer = pcmData.buffer;
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        // 4. Enviar a Gemini usando la propiedad audio
        try {
          sessionRef.current.sendRealtimeInput({
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64,
            },
          });
        } catch (e) {
          console.error("Error enviando audio:", e);
        }
      };

      source.connect(processor);
      // Conectar a un nodo silencioso para que el processor funcione
      processor.connect(audioCtx.destination);

      setIsRecording(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, [connectToGemini, initializeAudioContext]);

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (sessionRef.current) {
      // Intentar cerrar limpiamente si está abierto
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session", e);
      }
      sessionRef.current = null;
    }
    isConnectedRef.current = false;
    setIsRecording(false);
    setIsPlaying(false);
    audioQueueRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
        playbackContextRef.current.close();
      }
    };
  }, [stopRecording]);

  return { isRecording, isPlaying, error, startRecording, stopRecording };
}
