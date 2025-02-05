import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import "./App.css";

// Lazy load pages
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Profile = lazy(() => import("@/pages/Profile"));
const Participants = lazy(() => import("@/pages/Participants"));
const Friends = lazy(() => import("@/pages/Friends"));
const Messenger = lazy(() => import("@/pages/Messenger"));
const Activity = lazy(() => import("@/pages/Activity"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Index = lazy(() => import("@/pages/Index"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>Loading...</p>
    </div>
  </div>
);

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
          <DashboardLayout />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Index />
          </Suspense>
        ),
      },
      {
        path: "dashboard/profile",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: "dashboard/activity",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Activity />
          </Suspense>
        ),
      },
      {
        path: "dashboard/participants",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Participants />
          </Suspense>
        ),
      },
      {
        path: "dashboard/friends",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Friends />
          </Suspense>
        ),
      },
      {
        path: "dashboard/messenger",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Messenger />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
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
          <Suspense fallback={<LoadingFallback />}>
            <Register />
          </Suspense>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
  },
  {
    path: "*",
    element: (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </Suspense>
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