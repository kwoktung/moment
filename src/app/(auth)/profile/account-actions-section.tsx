"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

export const AccountActionsSection = () => {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/logout");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logout</CardTitle>
        <CardDescription>
          Sign out of your account. You will be redirected to the login page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <LogOut className="mr-2 size-4" />
              Leave
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will be redirected to the
                login page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
