import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import VoiceMessage from '@/components/VoiceMessage';
import MessageList from '@/components/MessageList';
import { useToast } from '@/hooks/use-toast';

const Messenger = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [selectedChat, setSelectedChat] = useState<string | null>(userId || null);
  const [newMessage, setNewMessage] = useState('');
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

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedChat],
    enabled: !!selectedChat && !!currentUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, first_name, last_name, avatar),
          receiver:profiles!receiver_id(id, first_name, last_name, avatar)
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

      return data;
    }
  });

  // Set up real-time subscription
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

  const sendMessage = async (
    content: string,
    type: 'text' | 'voice' | 'video' = 'text',
    voiceUrl?: string,
    duration?: number,
    waveform?: number[],
    videoUrl?: string,
    videoDuration?: number
  ) => {
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
          waveform,
          video_url: videoUrl,
          video_duration: videoDuration
        });

      if (error) throw error;
      if (type === 'text') setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob, waveform: number[], duration: number) => {
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
        duration,
        waveform
      );
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send voice message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleVideoMessage = async (videoBlob: Blob, duration: number) => {
    try {
      const filename = `video-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('video-messages')
        .upload(filename, videoBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('video-messages')
        .getPublicUrl(filename);

      await sendMessage(
        'Video message',
        'video',
        undefined,
        undefined,
        undefined,
        publicUrl,
        duration
      );
    } catch (error) {
      console.error('Error uploading video message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send video message. Please try again.',
        variant: 'destructive'
      });
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
          className={`p-4 cursor-pointer rounded-lg transition-colors ${
            selectedChat === chat.contact.id ? 'bg-accent' : 'hover:bg-accent/50'
          }`}
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
    <div className={`flex-1 flex-col ${isMobile ? (selectedChat ? 'flex' : 'hidden') : 'flex'}`}>
      {selectedChat && (
        <>
          {isMobile && (
            <div className="p-2 border-b">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
          <MessageList
            messages={messages || []}
            onDeleteMessage={(messageId, forAll) => deleteMutation.mutate({ messageId, forAll })}
            onEditMessage={(messageId, content) => editMutation.mutate({ messageId, content })}
          />
          <div ref={messagesEndRef} />
          <div className="flex gap-2 p-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
            />
            <VoiceMessage
              onRecordingComplete={handleVoiceMessage}
              onCancel={() => {}}
            />
            <Button onClick={() => sendMessage(newMessage)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5rem)] gap-4">
        {(!isMobile || !selectedChat) && renderChatList()}
        {renderMessageContainer()}
      </CardContent>
    </Card>
  );
};

export default Messenger;
