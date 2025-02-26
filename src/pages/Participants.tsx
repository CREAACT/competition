import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, MessageSquare, Trash2, Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const Participants = () => {
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    }
  });

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: friendships } = useQuery({
    queryKey: ['friendships'],
    enabled: !!currentUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${currentUser?.id},friend_id.eq.${currentUser?.id}`);
      
      if (error) throw error;
      return data;
    }
  });

  const handleAddFriend = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: currentUser?.id,
          friend_id: profileId,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('Friend request sent');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMessage = (profileId: string) => {
    navigate(`/dashboard/messenger?userId=${profileId}`);
    setSelectedProfile(null);
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      toast.success('Profile deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getFriendshipStatus = (profileId: string) => {
    if (!friendships) return null;
    return friendships.find(
      f => (f.user_id === currentUser?.id && f.friend_id === profileId) ||
           (f.user_id === profileId && f.friend_id === currentUser?.id)
    );
  };

  const getFriendRequestIcon = (profileId: string) => {
    const friendship = getFriendshipStatus(profileId);
    if (!friendship) return <UserPlus className="h-4 w-4" />;
    
    switch (friendship.status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading participants...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const ParticipantsList = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles?.map((profile) => {
            const isCurrentUser = profile.id === currentUser?.id;
            
            return (
              <div
                key={profile.id}
                className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback>
                        {profile.first_name[0]}{profile.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <Badge 
                        variant={profile.status === 'online' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {profile.status || 'offline'}
                      </Badge>
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddFriend(profile.id)}
                      >
                        {getFriendRequestIcon(profile.id)}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMessage(profile.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(!profiles || profiles.length === 0) && (
            <p className="text-muted-foreground col-span-3 text-center">No participants found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ParticipantsList />
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participant Profile</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedProfile.avatar_url || ''} />
                  <AvatarFallback>
                    {selectedProfile.first_name[0]}{selectedProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedProfile.first_name} {selectedProfile.last_name}
                  </h3>
                  <Badge 
                    variant={selectedProfile.status === 'online' ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {selectedProfile.status || 'offline'}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">About</h4>
                <p className="text-muted-foreground">
                  {selectedProfile.description || 'No description provided'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </QueryClientProvider>
  );
};

export default Participants;