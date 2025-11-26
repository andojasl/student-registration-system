"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateEmail } from "@/app/profile/actions";
import { Loader2 } from "lucide-react";

interface EmailChangeFormProps {
  currentEmail: string;
}

export function EmailChangeForm({ currentEmail }: EmailChangeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Store reference to form before async operations
    const form = e.currentTarget;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(form);
    const newEmail = formData.get('email') as string;

    const result = await updateEmail(newEmail);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.message || "Email update initiated");
      form.reset();
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>
          Current: {currentEmail}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">New Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter new email address"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Email"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
