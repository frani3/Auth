import { useState, useRef, useCallback } from "react";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

/**
 * Hook para grabar audio y enviarlo a Gemini para transcripción y respuesta
 * En vez de streaming, graba todo el audio y lo envía de una vez
 */
export function useVoiceRecorder(onResponse, systemPrompt = "") {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [userTranscript, setUserTranscript] = useState("");
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    // Convertir Blob a Base64
    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Extraer solo la parte base64 (sin el prefijo data:audio/...)
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Enviar audio a Gemini
    const sendAudioToGemini = async (audioBase64, mimeType) => {
        const today = new Date().toISOString().split('T')[0];
        
        const fullPrompt = `${systemPrompt}

INSTRUCCIONES IMPORTANTES:
1. Primero transcribe lo que el usuario dijo
2. Si el usuario quiere crear un evento, extrae los datos y responde en JSON
3. Si no es sobre eventos, responde normalmente en texto

Fecha de hoy: ${today}
Ubicaciones válidas: cen_am (Centro de Alumnos), sur_lab_a (Laboratorio A), sur_aud (Auditorio), sur_estudio (Sala de Estudio), preu_101 (Sala 101)

Si detectas intención de crear evento, responde SOLO con este JSON:
{
  "type": "event_data",
  "transcription": "lo que el usuario dijo",
  "titulo": "título del evento",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "ubicacion_id": "id de ubicación",
  "descripcion": "descripción opcional",
  "message": "tu respuesta al usuario"
}

Si NO es sobre eventos, responde con:
{
  "type": "chat",
  "transcription": "lo que el usuario dijo",
  "message": "tu respuesta"
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: fullPrompt },
                                {
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: audioBase64
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Error al procesar audio");
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        console.log("📝 Respuesta de Gemini:", textResponse);
        
        // Intentar parsear como JSON
        try {
            // Limpiar la respuesta (quitar ```json y ```)
            const cleanResponse = textResponse
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            const parsed = JSON.parse(cleanResponse);
            return parsed;
        } catch {
            // Si no es JSON, devolver como texto
            return {
                type: "chat",
                transcription: "",
                message: textResponse
            };
        }
    };

    // Iniciar grabación
    const startRecording = useCallback(async () => {
        try {
            setError(null);
            audioChunksRef.current = [];
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                } 
            });
            streamRef.current = stream;
            
            // Usar webm que es más compatible
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' 
                : 'audio/webm';
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                
                try {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    console.log("🎤 Audio grabado:", audioBlob.size, "bytes");
                    
                    if (audioBlob.size < 1000) {
                        throw new Error("Audio muy corto. Habla más tiempo.");
                    }
                    
                    const audioBase64 = await blobToBase64(audioBlob);
                    const result = await sendAudioToGemini(audioBase64, mimeType);
                    
                    // Guardar transcripción del usuario
                    if (result.transcription) {
                        setUserTranscript(result.transcription);
                    }
                    
                    // Llamar callback con la respuesta completa
                    if (onResponse) {
                        onResponse(result);
                    }
                } catch (err) {
                    console.error("Error procesando audio:", err);
                    setError(err.message);
                } finally {
                    setIsProcessing(false);
                }
            };
            
            mediaRecorder.start(100); // Grabar en chunks de 100ms
            setIsRecording(true);
            console.log("🔴 Grabando...");
            
        } catch (err) {
            console.error("Error iniciando grabación:", err);
            setError(err.message || "No se pudo acceder al micrófono");
        }
    }, [onResponse, systemPrompt]);

    // Detener grabación
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            console.log("⏹️ Grabación detenida");
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        setIsRecording(false);
    }, []);

    // Limpiar al desmontar
    const cleanup = useCallback(() => {
        stopRecording();
    }, [stopRecording]);

    return {
        isRecording,
        isProcessing,
        error,
        userTranscript,
        startRecording,
        stopRecording,
        cleanup
    };
}
