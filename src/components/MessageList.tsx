import { useState } from 'react';
import { Message } from '../types/message';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { MoreHorizontal, Check, CheckCheck } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

  const MessageActions = ({ message, isDesktop = false }: { message: Message; isDesktop?: boolean }) => {
    const Component = isDesktop ? DropdownMenu : ContextMenu;
    const Trigger = isDesktop ? DropdownMenuTrigger : ContextMenuTrigger;
    const Content = isDesktop ? DropdownMenuContent : ContextMenuContent;
    const Item = isDesktop ? DropdownMenuItem : ContextMenuItem;

    return (
      <Component>
        <Trigger>
          {isDesktop ? (
            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="absolute inset-0" />
          )}
        </Trigger>
        <Content>
          <Item onClick={() => handleEdit(message)}>Edit</Item>
          <Item onClick={() => onDeleteMessage(message.id, false)}>
            Delete for me
          </Item>
          <Item onClick={() => onDeleteMessage(message.id, true)}>
            Delete for everyone
          </Item>
        </Content>
      </Component>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto mb-4 px-4 space-y-4">
      {messages?.map((message) => {
        const isOwnMessage = message.sender_id === user?.id;
        
        return (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3 animate-fade-in",
              isOwnMessage ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className="h-8 w-8 mt-1 shrink-0">
              <AvatarImage 
                src={isOwnMessage ? message.sender?.avatar_url : message.receiver?.avatar_url} 
                alt={isOwnMessage ? 
                  `${message.sender?.first_name} ${message.sender?.last_name}` : 
                  `${message.receiver?.first_name} ${message.receiver?.last_name}`
                }
              />
              <AvatarFallback className="bg-primary/10">
                {isOwnMessage ? 
                  `${message.sender?.first_name?.[0]}${message.sender?.last_name?.[0]}` :
                  `${message.receiver?.first_name?.[0]}${message.receiver?.last_name?.[0]}`
                }
              </AvatarFallback>
            </Avatar>
            
            <div className={cn(
              "group relative max-w-[70%] rounded-lg p-3",
              isOwnMessage ? 
                "bg-primary text-primary-foreground" : 
                "bg-accent"
            )}>
              {editingMessageId === message.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(message.id)}
                  />
                  <button 
                    onClick={() => handleSaveEdit(message.id)}
                    className="text-xs opacity-70 hover:opacity-100"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="break-words text-sm">{message.content}</p>
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
                  <div className="hidden md:block">
                    <MessageActions message={message} isDesktop={true} />
                  </div>
                )}
              </div>
              
              {isOwnMessage && (
                <div className="md:hidden">
                  <MessageActions message={message} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;