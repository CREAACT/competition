import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import VoiceMessage from '@/components/VoiceMessage';
import MessageList from '@/components/MessageList';

const Messenger = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [selectedChat, setSelectedChat] = useState<string | null>(userId || null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      // Group messages by chat participant
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
      return data;
    }
  });

  const sendMessage = async (content: string, type: 'text' | 'voice' = 'text', voiceUrl?: string, duration?: number, waveform?: number[]) => {
    if ((!content && type === 'text') || !selectedChat || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedChat,
          content,
          message_type: type,
          voice_url: voiceUrl,
          voice_duration: duration,
          waveform
        });

      if (error) throw error;
      if (type === 'text') setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob, waveform: number[]) => {
    try {
      const filename = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(filename, audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(filename);

      await sendMessage(
        'Voice message',
        'voice',
        publicUrl,
        Math.round(audioBlob.size / 1024), // Approximate duration
        waveform
      );
    } catch (error) {
      console.error('Error uploading voice message:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderChatList = () => (
    <div className="w-full md:w-1/3 border-r pr-4 overflow-y-auto">
      {chats?.map((chat: any) => (
        <div
          key={chat.contact.id}
          className={`p-4 cursor-pointer rounded-lg transition-colors ${
            selectedChat === chat.contact.id ? 'bg-accent' : 'hover:bg-accent/50'
          }`}
          onClick={() => {
            setSelectedChat(chat.contact.id);
            if (isMobileView) {
              const messageContainer = document.querySelector('.message-container');
              if (messageContainer) {
                messageContainer.classList.remove('hidden');
              }
            }
          }}
        >
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={chat.contact.avatar_url || ''} />
              <AvatarFallback>
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
    <div className={`flex-1 flex-col ${isMobileView ? (selectedChat ? 'flex' : 'hidden') : 'flex'} message-container`}>
      {selectedChat ? (
        <>
          <MessageList messages={messages || []} />
          <div ref={messagesEndRef} />
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
            />
            <VoiceMessage onRecordingComplete={handleVoiceMessage} />
            <Button onClick={() => sendMessage(newMessage)}>
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
  );

  return (
    <Card className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5rem)] gap-4">
        {renderChatList()}
        {renderMessageContainer()}
      </CardContent>
    </Card>
  );
};

export default Messenger;