import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Paperclip, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageList from '@/components/MessageList';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/message';
import { cn } from '@/lib/utils';

const Messenger = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [selectedChat, setSelectedChat] = useState<string | null>(userId || null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: chats } = useQuery({
    queryKey: ['chats', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, first_name, last_name, avatar_url, status),
          receiver:profiles!receiver_id(id, first_name, last_name, avatar_url, status)
        `)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const chatsByParticipant = data.reduce((acc: any, message: any) => {
        const otherParticipant = message.sender_id === currentUser.id ? message.receiver : message.sender;
        if (!acc[otherParticipant.id]) {
          acc[otherParticipant.id] = {
            contact: otherParticipant,
            lastMessage: message
          };
        }
        return acc;
      }, {});

      return Object.values(chatsByParticipant);
    },
    enabled: !!currentUser
  });

  const { data: selectedChatUser } = useQuery({
    queryKey: ['chatUser', selectedChat],
    enabled: !!selectedChat,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedChat)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedChat],
    enabled: !!selectedChat && !!currentUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, first_name, last_name, avatar_url),
          receiver:profiles!receiver_id(id, first_name, last_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${currentUser?.id},receiver_id.eq.${selectedChat}),` +
          `and(sender_id.eq.${selectedChat},receiver_id.eq.${currentUser?.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages as read
      const unreadMessages = data.filter(
        msg => msg.sender_id === selectedChat && !msg.read_at
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));
      }

      return data as Message[];
    }
  });

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedChat},receiver_id=eq.${currentUser.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
          queryClient.invalidateQueries({ queryKey: ['chats', currentUser.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedChat, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async ({ messageId, forAll }: { messageId: string, forAll: boolean }) => {
      const updates = forAll
        ? { deleted_for_all: true, deleted_at: new Date().toISOString() }
        : { deleted_at: new Date().toISOString() };

      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
      toast({
        title: 'Message deleted',
        description: 'The message has been deleted successfully.'
      });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string, content: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
      toast({
        title: 'Message edited',
        description: 'The message has been edited successfully.'
      });
    }
  });

  const sendMessage = async (content: string) => {
    if (!content || !selectedChat || !currentUser) return;
    setIsSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedChat,
          content,
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBack = () => {
    setSelectedChat(null);
    navigate('/dashboard/messenger');
  };

  const renderChatList = () => (
    <div className="w-full md:w-1/3 border-r pr-4 overflow-y-auto">
      {chats?.map((chat: any) => (
        <div
          key={chat.contact.id}
          className={cn(
            "p-4 cursor-pointer rounded-lg transition-colors hover:bg-accent/50",
            selectedChat === chat.contact.id && "bg-accent"
          )}
          onClick={() => {
            setSelectedChat(chat.contact.id);
            if (isMobile) {
              navigate(`/dashboard/messenger?userId=${chat.contact.id}`);
            }
          }}
        >
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={chat.contact.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10">
                {chat.contact.first_name?.[0]}{chat.contact.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {chat.contact.first_name} {chat.contact.last_name}
              </h3>
              <Badge 
                variant={chat.contact.status === 'online' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {chat.contact.status || 'offline'}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMessageContainer = () => (
    <div className={cn(
      "flex-1 flex flex-col",
      isMobile ? (selectedChat ? 'flex' : 'hidden') : 'flex'
    )}>
      {selectedChat && (
        <>
          <div className="p-4 border-b flex items-center gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedChatUser?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10">
                  {selectedChatUser?.first_name?.[0]}{selectedChatUser?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">
                  {selectedChatUser?.first_name} {selectedChatUser?.last_name}
                </h3>
                <Badge 
                  variant={selectedChatUser?.status === 'online' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {selectedChatUser?.status || 'offline'}
                </Badge>
              </div>
            </div>
          </div>
          
          <MessageList
            messages={messages || []}
            onDeleteMessage={(messageId, forAll) => deleteMutation.mutate({ messageId, forAll })}
            onEditMessage={(messageId, content) => editMutation.mutate({ messageId, content })}
          />
          
          <div ref={messagesEndRef} />
          
          <div className="flex items-center gap-2 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t sticky bottom-0">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage(newMessage)}
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              onClick={() => sendMessage(newMessage)} 
              size="icon"
              className="shrink-0"
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
      <div className="flex h-full gap-4">
        {(!isMobile || !selectedChat) && renderChatList()}
        {renderMessageContainer()}
      </div>
    </Card>
  );
};

export default Messenger;