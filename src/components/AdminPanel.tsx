import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ban, UserX, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminPanel = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessages, setShowMessages] = useState(false);
  const queryClient = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_role', {
        role: 'admin'
      });
      if (error) throw error;
      return data;
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['adminMessages', selectedUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`sender_id.eq.${selectedUser.id},receiver_id.eq.${selectedUser.id}`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser && showMessages
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + error.message);
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'banned' })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User banned successfully');
    },
    onError: (error) => {
      toast.error('Failed to ban user: ' + error.message);
    }
  });

  if (!isAdmin) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback>
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {user.first_name} {user.last_name}
                  </h3>
                  <Badge variant={user.status === 'banned' ? 'destructive' : 'default'}>
                    {user.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowMessages(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => banUserMutation.mutate(user.id)}
                  disabled={user.status === 'banned'}
                >
                  <Ban className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteUserMutation.mutate(user.id)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={showMessages} onOpenChange={() => {
        setShowMessages(false);
        setSelectedUser(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Messages for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          {isLoadingMessages ? (
            <div>Loading messages...</div>
          ) : (
            <div className="space-y-4">
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={message.sender.avatar_url || ''} />
                      <AvatarFallback>
                        {message.sender.first_name[0]}{message.sender.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {message.sender.first_name} {message.sender.last_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      → {message.receiver.first_name} {message.receiver.last_name}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminPanel;