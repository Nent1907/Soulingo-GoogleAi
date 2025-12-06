import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Deepgram API Key
const DEEPGRAM_API_KEY = '46afc3490e7e1ab58dccd1586d670dad4a85dbc0';

// Helper to get a fresh client instance
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 1. TTS: Generate Speech for the Teacher (Gemini)
 */
export const generateTeacherSpeech = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    // Decode Audio
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );
    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

/**
 * 2. Transcribe Audio using Deepgram
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
  try {
    // FIX: Use language=en-US instead of detect_language=en-US
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en-US', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        // Trust the blob's type or default to webm
        'Content-Type': audioBlob.type || 'audio/webm'
      },
      body: audioBlob
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Deepgram API Failed:", response.status, errorText);
        throw new Error(`Deepgram request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    return transcript || "";

  } catch (error) {
    console.error("Deepgram Transcription Error:", error);
    return null;
  }
};

/**
 * 3. Analyze Pronunciation (Text Comparison via Gemini)
 * Now uses the transcript from Deepgram to compare against target.
 */
export const analyzePronunciation = async (userTranscript: string, targetSentence: string): Promise<AnalysisResult> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are an expert English pronunciation coach.
      
      Target Sentence: "${targetSentence}"
      Student Actually Said (Transcript): "${userTranscript}"
      
      Task:
      1. Compare what the student said to the target sentence.
      2. If the transcript is empty or very different (meaning they said something totally unrelated or nothing), give a low score.
      3. Rate their accuracy from 0 to 100.
      4. Identify words that are missing or wrong in the transcript.
      5. Provide a short, encouraging feedback message in Turkish.
      
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: prompt },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            highlighted_words: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["score", "feedback", "highlighted_words"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis received");
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      score: 0,
      feedback: "Analiz sırasında bir sorun oluştu, lütfen tekrar deneyin.",
      highlighted_words: []
    };
  }
};

/**
 * 4. Generate/Edit Avatar (Nano Banana / Gemini 2.5 Flash Image)
 */
export const generateAvatarImage = async (base64Image: string, stylePrompt: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const fullPrompt = `
      Edit this image.
      Goal: Transform the person into a "${stylePrompt}" style avatar.
      Keep the facial structure recognizable but apply the style strongly.
      Return the image only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg input
              data: base64Image
            }
          },
          { text: fullPrompt }
        ]
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;

  } catch (error) {
    console.error("Avatar Gen Error:", error);
    return null;
  }
};

/**
 * 5. Animate Avatar (Veo)
 */
export const generateAvatarVideo = async (base64Image: string): Promise<string | null> => {
  try {
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    const ai = getAiClient();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      image: {
        imageBytes: base64Image,
        mimeType: 'image/jpeg'
      },
      prompt: "A close-up video of this character talking naturally, looking at the camera, neutral expression, subtle head movements.",
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '1:1' 
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    return `${videoUri}&key=${process.env.API_KEY}`;

  } catch (error: any) {
    console.error("Veo Error:", JSON.stringify(error));
    if (error.status === 404 || 
       (error.message && error.message.includes("Requested entity was not found")) ||
       (error.error?.code === 404)) {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
        }
    }
    return null;
  }
};


// --- Helpers ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}