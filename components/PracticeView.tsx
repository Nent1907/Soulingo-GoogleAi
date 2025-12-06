import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, ArrowRight, ArrowLeft, Award, Loader2, Volume2 } from 'lucide-react';
import { Lesson, AnalysisResult, AvatarState } from '../types';
import { generateTeacherSpeech, analyzePronunciation, transcribeAudio } from '../services/geminiService';

interface PracticeViewProps {
  lesson: Lesson;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
  avatar: AvatarState;
}

const PracticeView: React.FC<PracticeViewProps> = ({ lesson, onNext, onPrevious, hasPrevious, avatar }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingTeacher, setIsPlayingTeacher] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const teacherAudioContextRef = useRef<AudioContext | null>(null);
  
  // Clean up
  useEffect(() => {
    return () => {
      if (teacherAudioContextRef.current) {
        teacherAudioContextRef.current.close();
      }
    };
  }, []);

  // Reset state when lesson changes
  useEffect(() => {
    setAnalysis(null);
    setUserTranscript(null);
  }, [lesson.id]);

  const playTeacherAudio = async () => {
    if (isPlayingTeacher) return;
    setIsPlayingTeacher(true);

    const buffer = await generateTeacherSpeech(lesson.sentence, avatar.voice);
    if (buffer) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      teacherAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      const source = teacherAudioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(teacherAudioContextRef.current.destination);
      source.onended = () => setIsPlayingTeacher(false);
      source.start();
    } else {
      setIsPlayingTeacher(false);
      alert("Ses üretilemedi.");
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4', // Safari usually prefers this
      'audio/ogg'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // Let the browser default if none match
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      
      const options = mimeType ? { mimeType } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        // Use the actual mime type from the recorder if possible, or fallback to what we asked for
        const actualMimeType = mediaRecorderRef.current?.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        handleAnalysis(blob); 
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAnalysis(null);
      setUserTranscript(null);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Mikrofona erişilemedi veya desteklenmeyen format.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      // 1. Transcribe with Deepgram
      const transcript = await transcribeAudio(blob);
      setUserTranscript(transcript);

      if (transcript) {
        // 2. Analyze with Gemini
        const result = await analyzePronunciation(transcript, lesson.sentence);
        setAnalysis(result);
      } else {
        setAnalysis({
          score: 0,
          feedback: "Ses algılanamadı veya çok kısa. Lütfen tekrar deneyin.",
          highlighted_words: []
        });
      }
    } catch (e) {
      console.error(e);
      alert("Analiz sırasında hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to highlight words
  const renderSentence = () => {
    if (!analysis) return <span className="text-slate-800">{lesson.sentence}</span>;

    const words = lesson.sentence.split(' ');
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {words.map((word, idx) => {
          const cleanWord = word.replace(/[.,!?]/g, '');
          const isBad = analysis.highlighted_words.some(w => w.toLowerCase().includes(cleanWord.toLowerCase()));
          return (
            <span 
              key={idx} 
              className={`px-1 rounded transition-colors ${isBad ? 'bg-red-100 text-red-600 font-bold' : 'text-green-600 font-medium'}`}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4 space-y-6">
      {/* Teacher / Avatar Area */}
      <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden aspect-square md:aspect-video flex items-center justify-center border-4 border-purple-100">
        {avatar.generatedVideo ? (
          <div className="relative w-full h-full">
            <video 
              src={avatar.generatedVideo} 
              autoPlay loop muted playsInline 
              className="w-full h-full object-cover"
            />
            {isPlayingTeacher && (
                <div className="absolute bottom-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    Konuşuyor...
                </div>
            )}
             <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                 {avatar.name}
             </div>
          </div>
        ) : avatar.generatedImage || avatar.originalImage ? (
           <div className="relative w-full h-full">
            <img 
              src={`data:image/jpeg;base64,${avatar.generatedImage || avatar.originalImage}`} 
              className={`w-full h-full object-cover ${isPlayingTeacher ? 'animate-pulse' : ''}`}
              alt="Avatar"
            />
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                 {avatar.name}
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
             <div className="w-24 h-24 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
               👩‍🏫
             </div>
             <p className="text-slate-500 font-medium">{avatar.name}</p>
          </div>
        )}
      </div>

      {/* Sentence Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm text-center space-y-2 relative">
         <h2 className="text-2xl font-bold brand-font leading-relaxed">
            {renderSentence()}
         </h2>
         <p className="text-slate-500 italic text-sm">{lesson.translation}</p>
         
         <button 
           onClick={playTeacherAudio}
           disabled={isPlayingTeacher}
           className="mt-3 text-purple-600 font-semibold flex items-center justify-center gap-2 hover:bg-purple-50 px-4 py-2 rounded-full mx-auto transition-colors text-sm"
         >
           {isPlayingTeacher ? <Volume2 className="animate-bounce w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
           {isPlayingTeacher ? 'Dinleniyor...' : 'Telaffuzu Dinle'}
         </button>
      </div>

      {/* Controls Area */}
      <div className="flex-1 flex flex-col justify-end space-y-4">
        
        {/* Analysis Status & Result */}
        <div className="min-h-[80px]">
            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl animate-pulse">
                    <Loader2 className="animate-spin mb-1" /> 
                    <span className="text-xs font-bold">Deepgram Sesi Analiz Ediyor...</span>
                </div>
            )}

            {!isAnalyzing && userTranscript && (
                <div className="text-center mb-2">
                    <p className="text-xs text-slate-400 uppercase font-bold">Algılanan:</p>
                    <p className="text-slate-700 italic">"{userTranscript}"</p>
                </div>
            )}

            {analysis && !isAnalyzing && (
            <div className={`p-4 rounded-xl border-l-4 shadow-sm ${analysis.score > 80 ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}>
                <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-lg">Puan: {analysis.score}</span>
                    {analysis.score > 80 ? <Award className="text-green-600 w-5 h-5" /> : null}
                </div>
                <p className="text-sm text-slate-700 leading-snug">{analysis.feedback}</p>
            </div>
            )}
        </div>

        {/* Buttons Grid */}
        <div className="space-y-3">
             {/* Record Button (Full Width) */}
            <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md
                ${isRecording 
                    ? 'bg-red-500 text-white scale-95 ring-4 ring-red-200' 
                    : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'}`}
            >
                {isRecording ? <Square className="fill-current" /> : <Mic />}
                {isRecording ? 'Bırak' : 'Basılı Tut ve Konuş'}
            </button>

            {/* Navigation Buttons (Row) */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className="py-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
                >
                    <ArrowLeft size={18} /> Önceki
                </button>

                <button
                    onClick={onNext}
                    className="py-3 bg-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-purple-700 transition-colors"
                >
                    Sonraki <ArrowRight size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeView;