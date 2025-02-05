import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Book, Trophy, MessageSquare, Award, PenTool, GraduationCap, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F1F0FB] text-foreground">
      {/* Hero Section - Enhanced with more animations */}
      <section className="container px-4 py-16 mx-auto space-y-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 opacity-0 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome to the English Spelling Olympiad!
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground animate-[fade-in_0.5s_ease-out_0.3s_forwards] opacity-0">
            Join the exciting battle to become the best speller!
          </p>
          <div className="flex items-center justify-center gap-4 text-primary animate-[fade-in_0.5s_ease-out_0.6s_forwards] opacity-0">
            <Book className="w-8 h-8 hover:scale-110 transition-transform" />
            <PenTool className="w-8 h-8 hover:scale-110 transition-transform" />
            <Trophy className="w-8 h-8 hover:scale-110 transition-transform" />
            <GraduationCap className="w-8 h-8 hover:scale-110 transition-transform" />
          </div>
        </div>

        <Card className="p-6 max-w-3xl mx-auto bg-white/80 backdrop-blur transform hover:scale-105 transition-all duration-300 animate-[fade-in_0.5s_ease-out_0.9s_forwards] opacity-0">
          <p className="text-lg leading-relaxed">
            Two participants compete at a time by writing the words dictated by our teacher,
            Parwina Saeed. Each round brings you closer to victory! The winner will receive
            <span className="font-bold text-primary"> 500 Tajikistani Somoni</span>!
          </p>
        </Card>

        {!user ? (
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-[fade-in_0.5s_ease-out_1.2s_forwards] opacity-0">
            <Button 
              onClick={() => navigate("/login")} 
              size="lg"
              className="group hover:scale-105 transition-transform"
            >
              <Users className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
              Join the Competition
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/register")} 
              size="lg"
              className="group hover:scale-105 transition-transform"
            >
              <PenTool className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
              Register Now
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => navigate("/dashboard")} 
            size="lg"
            className="group hover:scale-105 transition-transform animate-[fade-in_0.5s_ease-out_1.2s_forwards] opacity-0"
          >
            Go to Dashboard
          </Button>
        )}
      </section>

      {/* Rules Section - Enhanced with hover effects */}
      <section className="container px-4 py-12 mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 group">
          <Award className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          Olympiad Rules
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <AccordionItem value="item-1" className="border-b">
            <AccordionTrigger className="px-4 hover:text-primary transition-colors">
              How does the competition work?
            </AccordionTrigger>
            <AccordionContent className="px-4">
              Two participants compete per round, writing the words dictated by the teacher.
              Points are awarded for correctly spelled words.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="px-4 hover:text-primary transition-colors">
              How is the winner determined?
            </AccordionTrigger>
            <AccordionContent className="px-4">
              At the end of the competition, the participant with the most points will be
              announced as the winner and awarded the prize of 500 Tajikistani Somoni.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Teacher's Welcome - Enhanced with hover effect */}
      <section className="container px-4 py-12 mx-auto max-w-3xl">
        <Card className="p-6 bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-4">
            <MessageSquare className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Message from Our Teacher</h2>
              <p className="text-muted-foreground">
                "Welcome to our English Spelling Olympiad! I'm Parwina Saeed, and I'm excited
                to guide you through this competition. Together, we'll explore the fascinating
                world of English spelling while competing for an amazing prize. Good luck to
                all participants!"
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Word List Section - Enhanced with animations */}
      <section className="container px-4 py-12 mx-auto max-w-3xl">
        <Card className="p-6 bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Prepare for the Competition</h2>
            <p className="text-muted-foreground">
              Access the Headway Pre-Intermediate Wordlist to practice and prepare for the
              competition.
            </p>
            <Button className="w-full sm:w-auto group hover:scale-105 transition-transform">
              <Book className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
              View Word List
            </Button>
          </div>
        </Card>
      </section>

      {/* Prize Section - Enhanced with gradient and animations */}
      <section className="container px-4 py-12 mx-auto max-w-3xl mb-8">
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:shadow-xl transition-all duration-300">
          <div className="text-center space-y-4">
            <Trophy className="w-12 h-12 mx-auto text-primary animate-bounce" />
            <h2 className="text-2xl font-semibold">Grand Prize</h2>
            <p className="text-xl">
              Win <span className="font-bold text-primary">500 Tajikistani Somoni</span>
            </p>
            <p className="text-muted-foreground">
              Compete with your peers and showcase your spelling skills to win this amazing
              prize!
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Index;