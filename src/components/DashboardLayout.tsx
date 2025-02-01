import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { User, Users, LogOut, Menu, MessageSquare, UserPlus, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardLayout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('friends')
        .select(`
          user_id,
          profiles!friends_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (data) {
        setFriendRequests(data);
      }
    };

    fetchFriendRequests();

    // Subscribe to friend request changes
    const channel = supabase
      .channel('friend-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends'
        },
        () => {
          fetchFriendRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAcceptFriend = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Friend request accepted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Error logging out');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      const sheetCloseButton = document.querySelector('[data-sheet-close]') as HTMLButtonElement;
      sheetCloseButton?.click();
    }
  };

  const SidebarNavigation = () => (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigation('/dashboard/profile')} className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigation('/dashboard/participants')} className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Participants</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigation('/dashboard/friends')} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Friends</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavigation('/dashboard/messenger')} className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Messenger</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNavigation />
            </SheetContent>
          </Sheet>
        ) : (
          <Sidebar>
            <SidebarNavigation />
          </Sidebar>
        )}
        <main className="flex-1 p-6 md:p-8 pt-16 md:pt-8">
          <div className="fixed top-4 right-4 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {friendRequests.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                      {friendRequests.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {friendRequests.length === 0 ? (
                  <DropdownMenuItem>No new notifications</DropdownMenuItem>
                ) : (
                  friendRequests.map((request) => (
                    <DropdownMenuItem key={request.user_id} className="flex flex-col items-start">
                      <div className="flex justify-between w-full">
                        <span>
                          {request.profiles.first_name} {request.profiles.last_name} wants to be friends
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriend(request.user_id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
