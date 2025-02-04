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
import "./App.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <Index />
        <Toaster />
      </AuthProvider>
    ),
  },
  {
    path: "/login",
    element: (
      <AuthProvider>
        <Login />
        <Toaster />
      </AuthProvider>
    ),
  },
  {
    path: "/register",
    element: (
      <AuthProvider>
        <Register />
        <Toaster />
      </AuthProvider>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <AuthProvider>
        <DashboardLayout />
        <Toaster />
      </AuthProvider>
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
      <AuthProvider>
        <NotFound />
        <Toaster />
      </AuthProvider>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;