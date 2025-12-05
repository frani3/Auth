import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

// API Key - en producción usar variables de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const model = "gemini-2.0-flash-live-001";

// Singleton para evitar múltiples sesiones globalmente
let globalSessionActive = false;

// Palabras clave para finalizar la conversación
const PALABRAS_FIN = ['adiós', 'adios', 'chao', 'hasta luego', 'terminar', 'finalizar', 'cerrar', 'gracias eso es todo', 'eso es todo'];

export function useGeminiLive(onBotTranscript, onUserTranscript, systemPrompt = "Eres un asistente útil. Responde siempre en español de forma concisa.") {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [transcript, setTranscript] = useState("");

    const audioContextRef = useRef(null);
    const playbackContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const processorRef = useRef(null);
    const sessionRef = useRef(null);
    const audioQueueRef = useRef([]);
    const isPlayingRef = useRef(false);
    const isConnectedRef = useRef(false);
    const nextStartTimeRef = useRef(0);
    const currentSourceRef = useRef(null);
    const stopRecordingRef = useRef(null); // Referencia a stopRecording para usar en callbacks
    const isStartingRef = useRef(false); // Flag para prevenir múltiples inicios simultáneos
    
    // Buffers para acumular transcripciones
    const userTranscriptBuffer = useRef("");
    const geminiTranscriptBuffer = useRef("");
    const transcriptTimeoutRef = useRef(null);

    // Función para detectar palabras de fin
    const detectarFinConversacion = useCallback((texto) => {
        const textoLower = texto.toLowerCase().trim();
        return PALABRAS_FIN.some(palabra => textoLower.includes(palabra));
    }, []);

    // Función para detener el audio actual
    const stopCurrentAudio = useCallback(() => {
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
            } catch (e) {
                // Ignorar error si ya terminó
            }
            currentSourceRef.current = null;
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (playbackContextRef.current) {
            nextStartTimeRef.current = playbackContextRef.current.currentTime;
        }
    }, []);

    const initializeAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
            playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000,
            });
        }
    }, []);

    const playNextChunk = useCallback(() => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            currentSourceRef.current = null;
            return;
        }

        isPlayingRef.current = true;
        setIsPlaying(true);

        const chunk = audioQueueRef.current.shift();
        const audioCtx = playbackContextRef.current;

        if (!audioCtx || audioCtx.state === 'closed') {
            isPlayingRef.current = false;
            setIsPlaying(false);
            return;
        }

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
        
        // Guardar referencia al source actual
        currentSourceRef.current = source;

        const currentTime = audioCtx.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        source.start(startTime);

        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            if (currentSourceRef.current === source) {
                currentSourceRef.current = null;
            }
            playNextChunk();
        };
    }, []);

    const connectToGemini = useCallback(async () => {
        return new Promise(async (resolve) => {
            try {
                setError(null);
                const ai = new GoogleGenAI({ apiKey });

                const config = {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Aoede",
                            },
                        },
                    },
                    // Habilitar transcripción del input del usuario
                    inputAudioTranscription: {},
                    // Habilitar transcripción de la respuesta de Gemini
                    outputAudioTranscription: {},
                    systemInstruction: {
                        parts: [{ text: systemPrompt }],
                    },
                };

                const session = await ai.live.connect({
                    model,
                    config,
                    callbacks: {
                        onopen: () => {
                            isConnectedRef.current = true;
                            resolve(true);
                        },
                        onmessage: (message) => {
                            const serverContent = message.serverContent;
                            
                            if (!serverContent) return;
                            
                            // Capturar transcripción del usuario (acumular fragmentos)
                            if (serverContent.inputTranscription?.text) {
                                const fragment = serverContent.inputTranscription.text;
                                userTranscriptBuffer.current += fragment;
                            }
                            
                            // Capturar transcripción de la respuesta de Gemini (acumular fragmentos)
                            if (serverContent.outputTranscription?.text) {
                                const fragment = serverContent.outputTranscription.text;
                                geminiTranscriptBuffer.current += fragment;
                            }
                            
                            // Cuando termina el turno, enviar transcripciones completas
                            if (serverContent.turnComplete) {
                                if (userTranscriptBuffer.current.trim()) {
                                    const userText = userTranscriptBuffer.current.trim();
                                    setTranscript(userText);
                                    if (onUserTranscript) {
                                        onUserTranscript(userText);
                                    }
                                    
                                    // Detectar si el usuario quiere terminar la conversación
                                    if (detectarFinConversacion(userText)) {
                                        // Esperar un momento para que Gemini pueda despedirse
                                        setTimeout(() => {
                                            if (stopRecordingRef.current) {
                                                stopRecordingRef.current();
                                            }
                                        }, 3000); // Esperar 3 segundos para la despedida
                                    }
                                    
                                    userTranscriptBuffer.current = "";
                                }
                                
                                if (geminiTranscriptBuffer.current.trim()) {
                                    if (onBotTranscript) {
                                        onBotTranscript(geminiTranscriptBuffer.current.trim());
                                    }
                                    geminiTranscriptBuffer.current = "";
                                }
                            }
                            
                            // Procesar respuesta del modelo (audio)
                            if (serverContent.modelTurn?.parts) {
                                for (const part of serverContent.modelTurn.parts) {
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
                                }
                            }
                        },
                        onclose: (e) => {
                            isConnectedRef.current = false;
                        },
                        onerror: (e) => {
                            console.error("❌ Gemini Live Error", e);
                            isConnectedRef.current = false;
                            setError(e?.message || "Error de conexión con Gemini");
                            resolve(false);
                        },
                    },
                });
                sessionRef.current = session;
            } catch (err) {
                console.error("Error conectando:", err);
                setError(err?.message || "Error al conectar con Gemini Live API");
                resolve(false);
            }
        });
    }, [playNextChunk, onBotTranscript, onUserTranscript, systemPrompt]);

    const startRecording = useCallback(async () => {
        // Si ya está grabando, conectado, en proceso de inicio, o hay sesión global activa, no hacer nada
        if (isRecording || isConnectedRef.current || sessionRef.current || isStartingRef.current || globalSessionActive) {
            console.log('[GeminiLive] Sesión ya activa, ignorando startRecording');
            return;
        }
        
        // Marcar sesión global activa
        globalSessionActive = true;
        // Marcar que estamos iniciando
        isStartingRef.current = true;
        
        try {
            setError(null);
            initializeAudioContext();
            const audioCtx = audioContextRef.current;
            const playbackCtx = playbackContextRef.current;

            if (audioCtx.state === "suspended") {
                await audioCtx.resume();
            }
            if (playbackCtx.state === "suspended") {
                await playbackCtx.resume();
            }

            nextStartTimeRef.current = playbackCtx.currentTime;
            audioQueueRef.current = [];

            const connected = await connectToGemini();

            if (!connected) {
                throw new Error("No se pudo establecer conexión con Gemini");
            }

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

                const inputData = e.inputBuffer.getChannelData(0);
                const inputSampleRate = audioCtx.sampleRate;
                const targetSampleRate = 16000;
                let pcmData;

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

                const buffer = pcmData.buffer;
                let binary = "";
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);

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
            processor.connect(audioCtx.destination);

            setIsRecording(true);
            isStartingRef.current = false; // Inicio completado exitosamente
        } catch (err) {
            isStartingRef.current = false; // Reset en caso de error
            globalSessionActive = false; // Liberar sesión global en caso de error
            setError(err.message);
        }
    }, [connectToGemini, initializeAudioContext, isRecording]);

    const stopRecording = useCallback(() => {
        // Detener audio actual primero
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
            } catch (e) {
                // Ignorar
            }
            currentSourceRef.current = null;
        }
        
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        if (sessionRef.current) {
            try {
                sessionRef.current.close();
            } catch (e) {
                console.warn("Error closing session", e);
            }
            sessionRef.current = null;
        }
        isConnectedRef.current = false;
        isPlayingRef.current = false;
        isStartingRef.current = false; // Reset del flag de inicio
        globalSessionActive = false; // Liberar sesión global
        setIsRecording(false);
        setIsPlaying(false);
        audioQueueRef.current = [];
        
        // Resetear tiempo de reproducción
        if (playbackContextRef.current) {
            nextStartTimeRef.current = playbackContextRef.current.currentTime;
        }
    }, []);

    // Asignar stopRecording a la ref para usarlo en callbacks
    useEffect(() => {
        stopRecordingRef.current = stopRecording;
    }, [stopRecording]);

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

    return { isRecording, isPlaying, error, transcript, startRecording, stopRecording, stopCurrentAudio };
}
