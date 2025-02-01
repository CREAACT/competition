import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { User, Users, LogOut, Menu, MessageSquare, UserPlus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";

export function DashboardLayout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Update user status to online when component mounts
    const updateStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ status: 'online' })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    updateStatus();

    // Set up presence channel
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('Join:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    // Set status to offline when component unmounts
    return () => {
      const cleanup = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ status: 'offline' })
              .eq('id', user.id);
          }
          await supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error cleaning up:', error);
        }
      };
      cleanup();
    };
  }, []);

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
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}