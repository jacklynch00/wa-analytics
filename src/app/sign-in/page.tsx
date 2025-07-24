'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to sign in');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleMagicLink = async () => {
  //   if (!email) {
  //     setError('Please enter your email address');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError('');

  //   try {
  //     const result = await authClient.signIn.magicLink({
  //       email,
  //     });

  //     if (result.error) {
  //       setError(result.error.message || 'Failed to send magic link');
  //     } else {
  //       setMagicLinkSent(true);
  //     }
  //   } catch {
  //     setError('An unexpected error occurred');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // if (magicLinkSent) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <Card className="w-full max-w-md">
  //         <CardHeader>
  //           <CardTitle className="text-center">Check Your Email</CardTitle>
  //         </CardHeader>
  //         <CardContent className="text-center space-y-4">
  //           <p className="text-gray-600">
  //             We&apos;ve sent a magic link to <strong>{email}</strong>
  //           </p>
  //           <p className="text-sm text-gray-500">
  //             Click the link in your email to sign in.
  //           </p>
  //           <Button
  //             variant="outline"
  //             onClick={() => setMagicLinkSent(false)}
  //             className="w-full"
  //           >
  //             Back to Sign In
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/sign-up" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}