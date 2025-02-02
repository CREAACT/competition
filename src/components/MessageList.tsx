import { Message } from '@/types/message';
import { useAuth } from '@/hooks/useAuth';

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto mb-4">
      {messages?.map((message) => {
        const isOwnMessage = message.sender_id === user?.id;
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-[70%] ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-accent'} rounded-lg p-3`}>
              {message.message_type === 'voice' && message.voice_url && (
                <audio controls src={message.voice_url} className="w-full" />
              )}
              {message.message_type === 'text' && (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;