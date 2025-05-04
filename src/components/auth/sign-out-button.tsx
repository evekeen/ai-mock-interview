'use client';

import { useSignOut } from '@clerk/nextjs/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const { signOut, isLoaded } = useSignOut();
  const router = useRouter();

  const handleSignOut = async () => {
    if (!isLoaded) return;
    await signOut();
    router.push('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
    >
      Sign Out
    </button>
  );
} 