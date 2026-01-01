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
  usePendingInvite,
  useRelationship,
} from "@/hooks/queries/use-relationship";
import { handleApiError } from "@/lib/error-handler";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { formatTimeUntil } from "@/lib/format/timestamp";

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

const RelationshipPoller = () => {
  const router = useRouter();
  const { data: relationshipData } = useRelationship({ refetchInterval: 5000 });
  useEffect(() => {
    if (relationshipData?.relationship) {
      router.push("/home");
    }
  }, [relationshipData, router]);
  return null;
};

export default function PairPage() {
  const [activeTab, setActiveTab] = useState<"create" | "accept">("create");
  const [inviteCode, setInviteCode] = useState("");
  const [createdInvite, setCreatedInvite] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState("");

  // Construct invite URL from code
  const constructInviteUrl = (code: string) => {
    if (typeof window === "undefined") return "";
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}/sign-up?code=${code}`;
  };

  const router = useRouter();
  const createInviteMutation = useCreateInvite();
  const acceptInviteMutation = useAcceptInvite();
  const { data: pendingInviteData } = usePendingInvite();

  // Update createdInvite when pending invite data changes
  useEffect(() => {
    if (pendingInviteData?.invitation) {
      setCreatedInvite({
        code: pendingInviteData.invitation.inviteCode,
        expiresAt: pendingInviteData.invitation.expiresAt,
      });
    } else {
      setCreatedInvite(null);
    }
  }, [pendingInviteData]);

  const handleCreateInvite = async () => {
    setError("");
    try {
      // If there's an existing invite, we'll replace it with a new one
      // (The backend only allows one pending invite per user)
      const result = await createInviteMutation.mutateAsync();
      setCreatedInvite({
        code: result.inviteCode,
        expiresAt: result.expiresAt,
      });
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    try {
      await acceptInviteMutation.mutateAsync({
        inviteCode: inviteCode.trim().toUpperCase(),
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
            <div className="mb-4 flex gap-2 sm:mb-6">
              <Button
                type="button"
                variant={activeTab === "create" ? "default" : "outline"}
                className="flex-1 text-sm sm:text-base"
                onClick={() => {
                  setActiveTab("create");
                  setError("");
                }}
              >
                Invite Your Person
              </Button>
              <Button
                type="button"
                variant={activeTab === "accept" ? "default" : "outline"}
                className="flex-1 text-sm sm:text-base"
                onClick={() => {
                  setActiveTab("accept");
                  setError("");
                }}
              >
                I Got an Invite!
              </Button>
            </div>

            {/* Create Invite Tab */}
            {activeTab === "create" && (
              <div className="space-y-3 sm:space-y-4">
                {!createdInvite ? (
                  <>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Create a link to invite them! Your code stays active for a
                      week.
                    </p>
                    <Button
                      onClick={handleCreateInvite}
                      disabled={createInviteMutation.isPending}
                      className="w-full py-5 text-sm sm:py-6 sm:text-base"
                    >
                      {createInviteMutation.isPending
                        ? "Creating..."
                        : "Get My Invite Link"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="rounded-xl border border-border bg-secondary p-3 sm:p-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground sm:text-sm">
                        Share This Code
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xl font-bold tracking-wider sm:text-2xl md:text-3xl">
                          {createdInvite.code}
                        </code>
                        <CopyButton
                          text={createdInvite.code}
                          ariaLabel="Copy invite code"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-3 sm:p-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground sm:text-sm">
                        Or Share the Full Link
                      </p>
                      <div className="flex items-start gap-2 sm:items-center">
                        <code className="flex-1 break-all text-xs text-muted-foreground sm:truncate sm:text-sm">
                          {constructInviteUrl(createdInvite.code)}
                        </code>
                        <CopyButton
                          text={constructInviteUrl(createdInvite.code)}
                          ariaLabel="Copy share link"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary p-3 sm:p-4 shadow-warm">
                      <p className="text-sm text-foreground font-medium">
                        Waiting for them to join...
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Expires {formatTimeUntil(createdInvite.expiresAt)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCreatedInvite(null)}
                      className="w-full py-5 text-sm sm:py-6 sm:text-base"
                    >
                      Make a Fresh Invite
                    </Button>
                  </div>
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
