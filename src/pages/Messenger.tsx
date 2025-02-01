import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const Messenger = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats, isLoading: isLoadingChats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          distinct on (sender_id, receiver_id) *,
          sender:sender_id(
            first_name,
            last_name,
            avatar_url,
            status
          ),
          receiver:receiver_id(
            first_name,
            last_name,
            avatar_url,
            status
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return messages;
    }
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedChat],
    enabled: !!selectedChat,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(
            first_name,
            last_name,
            avatar_url
          ),
          receiver:receiver_id(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoadingChats) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading chats...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5rem)] gap-4">
        <div className="w-1/3 border-r pr-4 overflow-y-auto">
          {chats?.map((chat) => {
            const isReceiver = chat.receiver_id === selectedChat;
            const contact = isReceiver ? chat.receiver : chat.sender;
            
            return (
              <div
                key={contact?.id}
                className={`p-4 cursor-pointer rounded-lg transition-colors ${
                  selectedChat === contact?.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedChat(contact?.id)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={contact?.avatar_url || ''} />
                    <AvatarFallback>
                      {contact?.first_name[0]}{contact?.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {contact?.first_name} {contact?.last_name}
                    </h3>
                    <Badge 
                      variant={contact?.status === 'online' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {contact?.status || 'offline'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex-1 overflow-y-auto mb-4">
                {messages?.map((message) => {
                  const { data: { user } } = await supabase.auth.getUser();
                  const isOwnMessage = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-accent'} rounded-lg p-3`}>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Messenger;