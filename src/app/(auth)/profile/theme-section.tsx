"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";

export const ThemeSection = () => {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose your preferred color scheme or sync with system settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant={mounted && theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
            className="flex items-center gap-2"
          >
            <Sun className="size-4" />
            Light
          </Button>
          <Button
            variant={mounted && theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
            className="flex items-center gap-2"
          >
            <Moon className="size-4" />
            Dark
          </Button>
          <Button
            variant={mounted && theme === "system" ? "default" : "outline"}
            onClick={() => setTheme("system")}
            className="flex items-center gap-2"
          >
            <Monitor className="size-4" />
            System
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
