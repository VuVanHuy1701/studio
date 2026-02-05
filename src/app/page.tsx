import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Code2, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-12">
      <header className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center justify-center p-2 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 mr-2" />
          Welcome to Firebase Studio
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          Build something amazing
        </h1>
        <p className="text-xl text-muted-foreground">
          Your project is ready. Start by editing <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">src/app/page.tsx</code> to see your changes instantly.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        <Card className="text-left hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              Components
            </CardTitle>
            <CardDescription>
              Use ShadCN UI components to build your interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pre-configured with Tailwind CSS, Lucide Icons, and accessible components.
            </p>
          </CardContent>
        </Card>

        <Card className="text-left hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Genkit AI
            </CardTitle>
            <CardDescription>
              Integrated AI capabilities with Google Genkit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define flows and prompts in <code className="bg-muted px-1 rounded">src/ai/</code> to power your app with LLMs.
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="pt-12">
        <Button size="lg" className="rounded-full px-8">
          Get Started
        </Button>
      </footer>
    </div>
  );
}
