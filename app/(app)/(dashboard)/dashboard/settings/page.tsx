// app/dashboard/settings/page.tsx
import { redirect } from 'next/navigation';

export default function SettingsIndexPage() {
  // Automatically redirect users who land on /dashboard/settings
  // to the default profile tab at /dashboard/settings/profile
  redirect('/dashboard/settings/profile');
}
