import { redirect } from "next/navigation";
import { getUser } from "@/app/auth/actions";
import { getCurrentUserProfile } from "@/lib/db/queries";
import { ProfileForm } from "@/components/profile-form";
import { AvatarUpload } from "@/components/avatar-upload";
import { EmailChangeForm } from "@/components/email-change-form";
import { PasswordChangeForm } from "@/components/password-change-form";

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([
    getUser(),
    getCurrentUserProfile(),
  ]);

  if (!user || !profile) {
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Section */}
        <div className="md:col-span-2">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            userName={`${profile.first_name} ${profile.last_name}`}
          />
        </div>

        {/* Profile Information */}
        <ProfileForm profile={profile} />

        {/* Email Change */}
        <EmailChangeForm currentEmail={profile.email} />

        {/* Password Change */}
        <PasswordChangeForm />
      </div>
    </div>
  );
}
