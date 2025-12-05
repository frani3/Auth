import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI } from "@google/genai";

// NOTE: In a real app, do not expose API key on client. Use a proxy or ephemeral tokens.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const model = "gemini-2.5-flash-native-audio-preview-09-2025";

export function useGeminiLive(onTextReceived?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
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
    const audioCtx = audioContextRef.current!;

    // Safety check if context is closed
    if (audioCtx.state === 'closed') return;

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

  const connectToGemini = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const config = {
        responseModalities: ["AUDIO" as any],
        systemInstruction: {
          parts: [{ text: "You are a helpful assistant. Speak in Spanish." }],
        },
      };

      const session = await ai.live.connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            isConnectedRef.current = true;
          },
          onmessage: (message: any) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                  const base64 = part.inlineData.data;
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
                if (part.text && onTextReceived) {
                  onTextReceived(part.text);
                }
              }
            }
          },
          onclose: (e: any) => {
            console.log("Gemini Live Closed", e);
            isConnectedRef.current = false;
          },
          onerror: (e: any) => {
            console.error("Gemini Live Error", e);
            isConnectedRef.current = false;
            setError(e.message);
          },
        },
      });
      sessionRef.current = session;
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
  }, [playNextChunk, onTextReceived]);

  const startRecording = useCallback(async () => {
    try {
      initializeAudioContext();
      const audioCtx = audioContextRef.current!;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      
      // Reiniciar referencia de tiempo
      nextStartTimeRef.current = audioCtx.currentTime;
      audioQueueRef.current = [];

      await connectToGemini();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        // 1. Obtener datos del micrófono
        const inputData = e.inputBuffer.getChannelData(0);

        // 2. Downsampling (48kHz/44.1kHz -> 16kHz)
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

        // 4. Enviar a Gemini (SOLO UNA VEZ y AL FINAL)
        if (sessionRef.current && isConnectedRef.current) {
            try {
              sessionRef.current.sendRealtimeInput([
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64,
                },
              ]);
            } catch (e) {
              console.error("Error envío:", e);
            }
        }
      };

      source.connect(processor);
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

  return { isRecording, isPlaying, error, startRecording, stopRecording };
}
