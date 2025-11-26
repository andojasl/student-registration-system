"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadAvatar, deleteAvatar } from "@/app/profile/actions";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userName: string;
}

export function AvatarUpload({ currentAvatarUrl, userName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', file);

    const result = await uploadAvatar(formData);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setIsUploading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deleteAvatar();

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setIsDeleting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a profile picture to personalize your account
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={currentAvatarUrl || undefined} alt={userName} />
          <AvatarFallback className="text-2xl">{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading || isDeleting}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
            {currentAvatarUrl && (
              <Button
                type="button"
                variant="outline"
                disabled={isUploading || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading || isDeleting}
          />
          <p className="text-sm text-muted-foreground">
            JPG, PNG, WebP or GIF. Max 2MB.
          </p>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
