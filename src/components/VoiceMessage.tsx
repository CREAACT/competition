import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, X, Send } from 'lucide-react';

interface VoiceMessageProps {
  onRecordingComplete: (audioBlob: Blob, waveform: number[], duration: number) => void;
  onCancel: () => void;
}

const VoiceMessage = ({ onRecordingComplete, onCancel }: VoiceMessageProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const timerInterval = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        window.clearInterval(timerInterval.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyser = audioContext.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserNode.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      setWaveformData([]);
      setDuration(0);

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setPreviewBlob(audioBlob);
      };

      recorder.start(100);
      setIsRecording(true);

      // Start timer
      timerInterval.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start collecting waveform data
      const collectWaveformData = () => {
        if (!isRecording || !analyserNode.current) return;
        
        const dataArray = new Uint8Array(analyserNode.current.frequencyBinCount);
        analyserNode.current.getByteFrequencyData(dataArray);
        
        const average = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;
        setWaveformData(prev => [...prev, average]);
        
        if (isRecording) {
          requestAnimationFrame(collectWaveformData);
        }
      };

      collectWaveformData();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerInterval.current) {
        window.clearInterval(timerInterval.current);
      }
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = () => {
    if (previewBlob) {
      onRecordingComplete(previewBlob, waveformData, duration);
      setPreviewBlob(null);
      setWaveformData([]);
      setDuration(0);
    }
  };

  const handleCancel = () => {
    setPreviewBlob(null);
    setWaveformData([]);
    setDuration(0);
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!previewBlob ? (
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {isRecording && (
            <span className="text-sm text-muted-foreground">
              {formatDuration(duration)}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-[200px] h-10 bg-accent rounded-lg p-2">
            {waveformData.map((value, index) => (
              <div
                key={index}
                className="inline-block w-1 mx-[1px] bg-primary"
                style={{ height: `${value / 2}px` }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDuration(duration)}
          </span>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
          <Button variant="default" size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceMessage;