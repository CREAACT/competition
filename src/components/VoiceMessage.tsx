import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface VoiceMessageProps {
  onRecordingComplete: (audioBlob: Blob, waveform: number[]) => void;
}

const VoiceMessage = ({ onRecordingComplete }: VoiceMessageProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const waveformData = useRef<number[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserNode.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      waveformData.current = [];

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, waveformData.current);
      };

      recorder.start(100);
      setIsRecording(true);

      // Start collecting waveform data
      const collectWaveformData = () => {
        if (!isRecording || !analyserNode.current) return;
        
        const dataArray = new Uint8Array(analyserNode.current.frequencyBinCount);
        analyserNode.current.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude for this chunk
        const average = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;
        waveformData.current.push(average);
        
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
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default VoiceMessage;