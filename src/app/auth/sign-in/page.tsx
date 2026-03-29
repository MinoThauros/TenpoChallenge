"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInPageFallback />}>
      <SignInPageContent />
    </Suspense>
  );
}

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/marketing";
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(nextPath);
        router.refresh();
      }
    });
  }, [nextPath, router]);

  async function handleSubmit(values: z.infer<typeof signInSchema>) {
    const supabase = createSupabaseBrowserClient();

    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Image
            src="/images/logo/wordmark/wordmark-pitch-green.svg"
            alt="Tenpo"
            width={100}
            height={35}
          />
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="secondary">Supabase auth</Badge>
          <div className="space-y-4">
            <h1 className="text-h3">Sign in to unlock the marketing workspace</h1>
            <p className="max-w-xl text-body1 text-muted-foreground">
              The marketing hub now uses your authenticated Supabase session, so audience reads and campaign writes flow through RLS instead of a server-side bypass.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="text-base font-medium">What this enables</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each academy admin sees only their academy&apos;s marketing data, and the same auth model protects both the UI and the API.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-base font-medium">One setup note</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  The signed-in Supabase user needs an <code>academy_id</code> value in <code>app_metadata</code> for the marketing RLS policies to allow access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign in to Tenpo</CardTitle>
              <CardDescription>
                Use your Supabase-backed account to access audiences, campaigns, and imports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage ? (
                <Alert variant="error">
                  <AlertTitle>Sign-in failed</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="coach@academy.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Your password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogIn className="size-4" />
                    )}
                    Sign in
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function SignInPageFallback() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Image
            src="/images/logo/wordmark/wordmark-pitch-green.svg"
            alt="Tenpo"
            width={100}
            height={35}
          />
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="secondary">Supabase auth</Badge>
          <div className="space-y-4">
            <h1 className="text-h3">Sign in to unlock the marketing workspace</h1>
            <p className="max-w-xl text-body1 text-muted-foreground">
              The marketing hub now uses your authenticated Supabase session, so audience reads and campaign writes flow through RLS instead of a server-side bypass.
            </p>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Loading sign-in</CardTitle>
              <CardDescription>
                Preparing your authentication session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                One moment while we load the form.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
