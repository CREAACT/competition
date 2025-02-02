import { Message } from '../types/message';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { MoreHorizontal, Check, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageListProps {
  messages: Message[];
  onDeleteMessage: (messageId: string, forAll: boolean) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
}

const MessageList = ({ messages, onDeleteMessage, onEditMessage }: MessageListProps) => {
  const { user } = useAuth();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = (messageId: string) => {
    onEditMessage(messageId, editContent);
    setEditingMessageId(null);
    setEditContent('');
  };

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
                <div className="space-y-2">
                  <audio controls src={message.voice_url} className="w-full" />
                  {message.waveform && (
                    <div className="h-8 flex items-center">
                      {(message.waveform as number[]).map((value, index) => (
                        <div
                          key={index}
                          className="inline-block w-1 mx-[1px] bg-current opacity-50"
                          style={{ height: `${value / 2}px` }}
                        />
                      ))}
                    </div>
                  )}
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
                      <MoreHorizontal className="h-4 w-4" />
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