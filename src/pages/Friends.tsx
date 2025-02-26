import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserX, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Friends = () => {
  const navigate = useNavigate();
  const { data: friends, isLoading, refetch } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          status,
          profiles!friends_friend_id_fkey (
            first_name,
            last_name,
            avatar_url,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;
      return data;
    }
  });

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete both directions of the friendship
      const { error: error1 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      const { error: error2 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      if (error1 || error2) throw error1 || error2;
      
      toast.success('Friend removed successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMessage = (friendId: string) => {
    navigate(`/dashboard/messenger?userId=${friendId}`);
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading friends...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends?.map((friend) => (
            <div
              key={friend.friend_id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={friend.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {friend.profiles?.first_name?.[0]}{friend.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {friend.profiles?.first_name} {friend.profiles?.last_name}
                    </h3>
                    <Badge 
                      variant={friend.profiles?.status === 'online' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {friend.profiles?.status || 'offline'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMessage(friend.friend_id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFriend(friend.friend_id)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {(!friends || friends.length === 0) && (
            <p className="text-muted-foreground col-span-3 text-center">No friends yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Friends;