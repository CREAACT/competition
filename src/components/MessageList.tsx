import { useState } from 'react';
import { Message } from '../types/message';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { MoreHorizontal, Check, CheckCheck, Play, Pause } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  messages: Message[];
  onDeleteMessage: (messageId: string, forAll: boolean) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
}

const MessageList = ({ messages, onDeleteMessage, onEditMessage }: MessageListProps) => {
  const { user } = useAuth();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = (messageId: string) => {
    onEditMessage(messageId, editContent);
    setEditingMessageId(null);
    setEditContent('');
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto mb-4 px-4">
      {messages?.map((message) => {
        const isOwnMessage = message.sender_id === user?.id;
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div 
              className={`max-w-[70%] ${
                isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-accent'
              } rounded-lg p-3`}
            >
              {message.message_type === 'voice' && message.voice_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6"
                      onClick={() => {
                        const audio = document.getElementById(`audio-${message.id}`) as HTMLAudioElement;
                        if (playingAudio === message.id) {
                          audio.pause();
                          setPlayingAudio(null);
                        } else {
                          audio.play();
                          setPlayingAudio(message.id);
                        }
                      }}
                    >
                      {playingAudio === message.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <span className="text-xs">{formatDuration(message.voice_duration)}</span>
                    <audio
                      src={message.voice_url}
                      controls={false}
                      id={`audio-${message.id}`}
                      onEnded={() => setPlayingAudio(null)}
                    />
                  </div>
                  {message.waveform && (
                    <div className="h-6 flex items-center">
                      {message.waveform.map((value, index) => (
                        <div
                          key={index}
                          className="inline-block w-[2px] mx-[1px] bg-current opacity-50"
                          style={{ height: `${value / 4}px` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {message.message_type === 'video' && message.video_url && (
                <div className="relative w-24 h-24 rounded-full overflow-hidden">
                  <video
                    src={message.video_url}
                    className="absolute inset-0 w-full h-full object-cover"
                    controls
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 bg-black/50 hover:bg-black/70"
                      onClick={() => {
                        const video = document.querySelector(`video[src="${message.video_url}"]`) as HTMLVideoElement;
                        if (playingVideo === message.id) {
                          video.pause();
                          setPlayingVideo(null);
                        } else {
                          video.play();
                          setPlayingVideo(message.id);
                        }
                      }}
                    >
                      {playingVideo === message.id ? (
                        <Pause className="h-3 w-3 text-white" />
                      ) : (
                        <Play className="h-3 w-3 text-white" />
                      )}
                    </Button>
                  </div>
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 px-1.5 py-0.5 rounded text-white">
                    {formatDuration(message.video_duration)}
                  </span>
                </div>
              )}
              {message.message_type === 'text' && (
                editingMessageId === message.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 bg-transparent border-none focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(message.id)}
                    />
                    <button onClick={() => handleSaveEdit(message.id)}>Save</button>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )
              )}
              <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                {message.edited_at && <span>(edited)</span>}
                {isOwnMessage && (
                  <>
                    {message.read_at ? (
                      <CheckCheck className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </>
                )}
                {isOwnMessage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreHorizontal className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(message)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteMessage(message.id, false)}>
                        Delete for me
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteMessage(message.id, true)}>
                        Delete for everyone
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;