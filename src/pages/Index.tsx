import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Book, Trophy, MessageSquare, Award, PenTool } from "lucide-react";
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
      {/* Hero Section */}
      <section className="container px-4 py-16 mx-auto space-y-8 animate-fade-in">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Welcome to the English Spelling Olympiad!
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Join the exciting battle to become the best speller!
          </p>
          <div className="flex items-center justify-center gap-4 text-primary">
            <Book className="w-8 h-8" />
            <PenTool className="w-8 h-8" />
            <Trophy className="w-8 h-8" />
          </div>
        </div>

        <Card className="p-6 max-w-3xl mx-auto bg-white/80 backdrop-blur">
          <p className="text-lg leading-relaxed">
            Two participants compete at a time by writing the words dictated by our teacher,
            Parwina Saeed. Each round brings you closer to victory! The winner will receive
            <span className="font-bold text-primary"> 500 Tajikistani Somoni</span>!
          </p>
        </Card>

        {!user ? (
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/login")} size="lg">
              Join the Competition
            </Button>
            <Button variant="outline" onClick={() => navigate("/register")} size="lg">
              Register Now
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate("/dashboard")} size="lg">
            Go to Dashboard
          </Button>
        )}
      </section>

      {/* Rules Section */}
      <section className="container px-4 py-12 mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Olympiad Rules
        </h2>
        <Accordion type="single" collapsible className="bg-white rounded-lg">
          <AccordionItem value="item-1">
            <AccordionTrigger className="px-4">How does the competition work?</AccordionTrigger>
            <AccordionContent className="px-4">
              Two participants compete per round, writing the words dictated by the teacher.
              Points are awarded for correctly spelled words.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="px-4">How is the winner determined?</AccordionTrigger>
            <AccordionContent className="px-4">
              At the end of the competition, the participant with the most points will be
              announced as the winner and awarded the prize of 500 Tajikistani Somoni.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Teacher's Welcome */}
      <section className="container px-4 py-12 mx-auto max-w-3xl">
        <Card className="p-6 bg-white/80 backdrop-blur">
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

      {/* Word List Section */}
      <section className="container px-4 py-12 mx-auto max-w-3xl">
        <Card className="p-6 bg-white/80 backdrop-blur">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Prepare for the Competition</h2>
            <p className="text-muted-foreground">
              Access the Headway Pre-Intermediate Wordlist to practice and prepare for the
              competition.
            </p>
            <Button className="w-full sm:w-auto">
              <Book className="mr-2 h-4 w-4" />
              View Word List
            </Button>
          </div>
        </Card>
      </section>

      {/* Prize Section */}
      <section className="container px-4 py-12 mx-auto max-w-3xl mb-8">
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <Trophy className="w-12 h-12 mx-auto text-primary" />
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