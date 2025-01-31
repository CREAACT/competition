import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type Profile = Tables<'profiles'>;

const Participants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('first_name', { ascending: true });

        if (error) throw error;
        setProfiles(data || []);
      } catch (error: any) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();

    // Subscribe to realtime changes for both profile updates and presence
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile change received!', payload);
          fetchProfiles();
        }
      )
      .subscribe();

    // Set up presence channel for real-time status updates
    const presenceChannel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
        fetchProfiles(); // Refresh profiles to get latest status
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('Join:', key);
        fetchProfiles(); // Refresh profiles when someone joins
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('Leave:', key);
        fetchProfiles(); // Refresh profiles when someone leaves
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const filteredProfiles = profiles.filter(profile => 
    `${profile.first_name} ${profile.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Participants</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm w-full"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-grow">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No participants found
            </div>
          ) : (
            filteredProfiles.map((profile) => (
              <div 
                key={profile.id} 
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg transition-colors hover:bg-secondary/70"
              >
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url || undefined} alt={`${profile.first_name} ${profile.last_name}`} />
                  <AvatarFallback>{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium truncate">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Joined {format(new Date(profile.created_at), 'PP')}
                  </p>
                </div>
                <Badge 
                  variant={profile.status === 'online' ? 'default' : 'secondary'}
                  className="flex-shrink-0 whitespace-nowrap"
                >
                  {profile.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Participants;