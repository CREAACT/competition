import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Participants from "@/pages/Participants";
import Friends from "@/pages/Friends";
import Messenger from "@/pages/Messenger";
import Activity from "@/pages/Activity";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Index />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
  },
  {
    path: "/login",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Login />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
  },
  {
    path: "/register",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Register />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardLayout />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
    children: [
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "activity",
        element: <Activity />,
      },
      {
        path: "participants",
        element: <Participants />,
      },
      {
        path: "friends",
        element: <Friends />,
      },
      {
        path: "messenger",
        element: <Messenger />,
      },
    ],
  },
  {
    path: "*",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotFound />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;