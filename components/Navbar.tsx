"use client";

import { signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface NavbarProps {
  session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  return (
    <header className="w-full border-b bg-muted/50 dark:bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-lg">caption.ai</div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden sm:block text-sm font-medium">{session.user?.name}</span>
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="avatar"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700" />
                )}
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700" />
                <Button
                  variant="default"
                  onClick={() => signIn("google")}
                  className="dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}