import Link from "next/link";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/next/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileText,
  Image as ImageIcon,
  Smile,
  Trash2,
  Moon,
  Zap,
} from "lucide-react";

export default async function Home() {
  const context = await getCloudflareContext({ async: true });
  const session = await getSession(context.env.JWT_SECRET);

  if (session) {
    redirect("/home");
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Journal</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Your Personal Journal
            <br />
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Share your thoughts, moments, and memories with rich media support.
            A clean, modern journaling experience built for you.
          </p>
          <div className="flex gap-4 items-center justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-base">
                Get Started
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">
          Everything You Need
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Quick Posts</h4>
              </div>
              <p className="text-muted-foreground">
                Share your thoughts with 280-character posts. Perfect for quick
                updates and daily reflections.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ImageIcon className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Rich Media</h4>
              </div>
              <p className="text-muted-foreground">
                Attach up to 4 images, videos, or documents to each post. Bring
                your memories to life.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smile className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Emoji Support</h4>
              </div>
              <p className="text-muted-foreground">
                Express yourself with built-in emoji picker. Add personality to
                every post.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Moon className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Dark Mode</h4>
              </div>
              <p className="text-muted-foreground">
                Automatic theme switching based on your system preferences. Easy
                on the eyes, day or night.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trash2 className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Full Control</h4>
              </div>
              <p className="text-muted-foreground">
                Manage your posts with ease. Delete any post whenever you want
                with a simple click.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Lightning Fast</h4>
              </div>
              <p className="text-muted-foreground">
                Built with modern technologies for a smooth, responsive
                experience on any device.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Join now and start capturing your thoughts and memories.
            </p>
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="text-base">
                Create Your Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Your personal journal platform. Simple, elegant, and powerful.</p>
        </div>
      </footer>
    </div>
  );
}
