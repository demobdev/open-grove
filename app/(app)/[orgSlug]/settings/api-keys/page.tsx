"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAiAccess } from "@/components/ai/use-ai-access";

export default function ApiKeysPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const apiKeys = useQuery(api.apiKeys.listApiKeys);
  const createApiKey = useMutation(api.apiKeys.createApiKey);
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey);
  const aiAccess = useAiAccess();
  
  const [open, setOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For real implementation, you'd generate this securely.
  // We're simulating a key generation that gets hashed on the server.
  const generateRandomKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "og_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const rawKey = generateRandomKey();
      const prefix = rawKey.substring(0, 11); // "og_12345678"
      
      // Hash the key using Web Crypto API to send to the server
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey.substring(7)); // Hash everything after "og_"
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      await createApiKey({
        name: newKeyName,
        scopes: ["all"],
        keyHash,
        prefix,
      });
      
      setCreatedKey(rawKey);
      setNewKeyName("");
      toast.success("API key created");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create API key");
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      toast.success("Copied to clipboard");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedKey(null);
  };

  if (!aiAccess.hasAccess) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/10 animate-in fade-in duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4 border shadow-sm">
          <KeyRound className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">API Access</h3>
        <p className="text-muted-foreground max-w-[400px] mb-6 text-sm">
          Connecting external agents like Cursor or Claude Code requires a Pro or Enterprise plan.
        </p>
        <Button asChild className="shadow-sm">
          <a href={`/${orgSlug}/settings/billing`}>Upgrade Plan</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
        <p className="text-muted-foreground">
          Manage API keys for external agents and integrations.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Workspace API Keys</CardTitle>
            <CardDescription>
              These keys grant access to your workspace data and agent infrastructure.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            else setOpen(val);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create new key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {createdKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Save your API Key</DialogTitle>
                    <DialogDescription>
                      Please copy this key and save it somewhere safe. For security reasons, 
                      <strong>we cannot show it to you again</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 mt-4">
                    <Input readOnly value={createdKey} className="font-mono" />
                    <Button size="icon" variant="outline" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button onClick={handleClose}>I have saved my key</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Generate a new key to authenticate external services.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateKey} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Key Name</Label>
                      <Input 
                        id="name" 
                        required
                        placeholder="e.g. Cursor Integration" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Generate Key"}
                      </Button>
                    </DialogFooter>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {apiKeys === undefined ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <KeyRound className="h-8 w-8 mb-4 opacity-20" />
              <p>No API keys generated yet.</p>
            </div>
          ) : (
            <div className="divide-y border rounded-md">
              {apiKeys.map((key) => (
                <div key={key._id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.name}</p>
                      {key.revokedAt && (
                        <Badge variant="destructive" className="h-5 text-[10px]">Revoked</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                        {key.prefix}••••••••••••
                      </code>
                      {key.lastUsedAt && !key.revokedAt && (
                        <span className="text-xs text-muted-foreground">
                          Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {!key.revokedAt && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to revoke this key? Any integrations using it will immediately break.")) {
                          revokeApiKey({ apiKeyId: key._id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
