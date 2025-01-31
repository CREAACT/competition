import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Participants = () => {
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading participants...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles?.map((profile) => (
              <div
                key={profile.id}
                className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setSelectedProfile(profile)}
              >
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
};

export default Participants;