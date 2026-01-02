"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  useCreateInvite,
  useAcceptInvite,
} from "@/hooks/mutations/use-relationship-mutations";
import {
  useInviteCode,
  useRelationship,
} from "@/hooks/queries/use-relationship";
import { handleApiError } from "@/lib/error-handler";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  ariaLabel?: string;
}

function CopyButton({
  text,
  ariaLabel = "Copy to clipboard",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleCopy}
      className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
      aria-label={ariaLabel}
    >
      {copied ? (
        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </Button>
  );
}

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function InfoCard({ title, children, className = "" }: InfoCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-secondary p-3 sm:p-4 ${className}`}
    >
      <p className="mb-2 text-xs font-semibold text-muted-foreground sm:text-sm">
        {title}
      </p>
      {children}
    </div>
  );
}

function constructInviteUrl(code: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/sign-up?code=${code}`;
}

interface InviteDisplayProps {
  inviteCode: string;
  onRegenerateCode: () => void;
  isRegenerating: boolean;
}

function InviteDisplay({
  inviteCode,
  onRegenerateCode,
  isRegenerating,
}: InviteDisplayProps) {
  const inviteUrl = constructInviteUrl(inviteCode);

  return (
    <div className="space-y-3 sm:space-y-4">
      <InfoCard title="Your Invite Code">
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xl font-bold tracking-wider sm:text-2xl md:text-3xl">
            {inviteCode}
          </code>
          <CopyButton text={inviteCode} ariaLabel="Copy invite code" />
        </div>
      </InfoCard>

      <InfoCard title="Or Share the Full Link">
        <div className="flex items-start gap-2 sm:items-center">
          <code className="flex-1 break-all text-xs text-muted-foreground sm:truncate sm:text-sm">
            {inviteUrl}
          </code>
          <CopyButton text={inviteUrl} ariaLabel="Copy share link" />
        </div>
      </InfoCard>
      <Button
        variant="outline"
        onClick={onRegenerateCode}
        disabled={isRegenerating}
        className="w-full py-5 text-sm sm:py-6 sm:text-base"
      >
        {isRegenerating ? "Creating..." : "Generate New Code"}
      </Button>
    </div>
  );
}

function RelationshipPoller() {
  const router = useRouter();
  const { data: relationshipData } = useRelationship({ refetchInterval: 5000 });

  useEffect(() => {
    if (relationshipData?.relationship) {
      router.push("/home");
    }
  }, [relationshipData, router]);

  return null;
}

export default function PairPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "accept">("create");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const createInviteMutation = useCreateInvite();
  const acceptInviteMutation = useAcceptInvite();
  const { data: inviteCodeData } = useInviteCode();

  const handleTabChange = (tab: "create" | "accept") => {
    setActiveTab(tab);
    setError("");
  };

  const handleRegenerateCode = async () => {
    setError("");
    try {
      await createInviteMutation.mutateAsync();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      setError("Please enter an invite code");
      return;
    }

    try {
      await acceptInviteMutation.mutateAsync({
        inviteCode: trimmedCode.toUpperCase(),
      });
      router.push("/home");
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <>
      <RelationshipPoller />
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-lg space-y-4 sm:space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
              Let&apos;s Connect!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Create your memories together, one moment at a time
            </p>
          </div>

          <Card className="p-4 sm:p-6">
            {/* Tab Buttons */}
            <div className="flex gap-2 sm:mb-6">
              <Button
                type="button"
                variant={activeTab === "create" ? "default" : "outline"}
                className="flex-1 text-sm sm:text-base"
                onClick={() => handleTabChange("create")}
              >
                Share Code
              </Button>
              <Button
                type="button"
                variant={activeTab === "accept" ? "default" : "outline"}
                className="flex-1 text-sm sm:text-base"
                onClick={() => handleTabChange("accept")}
              >
                Use Code
              </Button>
            </div>

            {/* Create Invite Tab */}
            {activeTab === "create" && (
              <div className="space-y-3 sm:space-y-4">
                {inviteCodeData?.inviteCode ? (
                  <InviteDisplay
                    inviteCode={inviteCodeData.inviteCode}
                    onRegenerateCode={handleRegenerateCode}
                    isRegenerating={createInviteMutation.isPending}
                  />
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Your invite code will be created automatically and never
                      expires!
                    </p>
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Accept Invite Tab */}
            {activeTab === "accept" && (
              <form
                onSubmit={handleAcceptInvite}
                className="space-y-3 sm:space-y-4"
              >
                <div>
                  <p className="mb-3 text-sm text-muted-foreground sm:mb-4 sm:text-base">
                    Got a code from them? Enter it here to connect!
                  </p>
                  <label
                    htmlFor="inviteCode"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Enter Code
                  </label>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    placeholder="AB12CD34"
                    maxLength={8}
                    className="h-12 font-mono text-base uppercase tracking-wider sm:h-14 sm:text-lg"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    acceptInviteMutation.isPending || !inviteCode.trim()
                  }
                  className="w-full py-5 text-sm sm:py-6 sm:text-base"
                >
                  {acceptInviteMutation.isPending ? "Joining..." : "Let's Go!"}
                </Button>
              </form>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive sm:mt-4">
                {error}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
