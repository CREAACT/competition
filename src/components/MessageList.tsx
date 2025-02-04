import { useState } from 'react';
import { Message } from '../types/message';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { MoreVertical, Check, CheckCheck, Reply, Loader2 } from 'lucide-react';
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
  onReplyMessage?: (message: Message) => void;
  isLoading?: boolean;
}

const MessageList = ({ messages, onDeleteMessage, onEditMessage, onReplyMessage, isLoading }: MessageListProps) => {
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const shouldShowAvatar = (messages: Message[], index: number, currentMessage: Message) => {
    if (index === 0) return true;
    const previousMessage = messages[index - 1];
    return previousMessage.sender_id !== currentMessage.sender_id;
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
              <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700 transition-colors" />
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
          {onReplyMessage && (
            <Item onClick={() => onReplyMessage(message)}>
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </Item>
          )}
        </Content>
      </Component>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto mb-4 px-4 space-y-4 bg-gray-50">
      {messages?.map((message, index) => {
        const isOwnMessage = message.sender_id === user?.id;
        const showAvatar = !isOwnMessage && shouldShowAvatar(messages, index, message);
        
        return (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3 animate-fade-in",
              isOwnMessage ? "flex-row-reverse" : "flex-row"
            )}
          >
            {showAvatar && (
              <Avatar className="h-10 w-10 mt-1 shrink-0 ring-2 ring-primary/10">
                <AvatarImage 
                  src={message.sender?.avatar_url} 
                  alt={`${message.sender?.first_name} ${message.sender?.last_name}`}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-500">
                  {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={cn(
              "group relative max-w-[70%] rounded-lg p-3 shadow-sm transition-all",
              isOwnMessage ? 
                "bg-blue-500 text-white hover:bg-blue-600" : 
                "bg-white hover:bg-gray-50",
              !showAvatar && !isOwnMessage && "ml-[52px]" // Add margin when avatar is hidden
            )}>
              {editingMessageId === message.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(message.id)}
                  />
                  <button 
                    onClick={() => handleSaveEdit(message.id)}
                    className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  {showAvatar && !isOwnMessage && (
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {message.sender?.first_name} {message.sender?.last_name}
                    </div>
                  )}
                  <p className={cn(
                    "break-words text-sm leading-relaxed",
                    !isOwnMessage && "text-gray-800"
                  )}>
                    {message.content}
                  </p>
                </>
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