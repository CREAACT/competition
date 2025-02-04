import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Welcome to Your App</h1>
        <p className="text-xl text-muted-foreground">Start your journey here!</p>
        <div className="space-x-4">
          {!user ? (
            <>
              <Button onClick={() => navigate("/login")}>Login</Button>
              <Button variant="outline" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;