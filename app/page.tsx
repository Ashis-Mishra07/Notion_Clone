"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import Loading from "@/components/Loading";
import Logo from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="min-h-full flex flex-col">
      {/* Navbar */}
      <div className="flex items-center justify-between w-full p-6">
        <Logo />
        <div className="flex items-center gap-x-2">
          {isLoading && <Loading />}
          {!isLoading && !isAuthenticated && (
            <>
              <SignInButton mode="modal">
                <Button size="sm" variant="ghost">
                  Login
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm">Get Notion free</Button>
              </SignInButton>
            </>
          )}
          {!isLoading && isAuthenticated && (
            <>
              <UserButton afterSignOutUrl="/" />
              <Link href="/documents">
                <Button size="sm">
                  Enter Notion
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
          <ModeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center md:justify-start text-center gap-y-8 flex-1 px-6 pb-10">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
            Your Ideas, Documents, & Plans. Unified. Welcome to{" "}
            <span className="underline">Notion</span>
          </h1>
          <h3 className="text-base sm:text-xl md:text-2xl font-medium">
            Notion is the connected workspace where <br />
            better, faster work happens.
          </h3>
        </div>

        {!isLoading && !isAuthenticated && (
          <SignInButton mode="modal">
            <Button>
              Get Notion free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </SignInButton>
        )}

        {!isLoading && isAuthenticated && (
          <Link href="/documents">
            <Button>
              Enter Notion
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
        <div className="flex flex-col items-center justify-center max-w-5xl relative w-full h-[400px]">
          <Image
            src="/documents.png"
            fill
            className="object-contain dark:hidden"
            alt="Documents"
          />
          <Image
            src="/documents-dark.png"
            fill
            className="object-contain hidden dark:block"
            alt="Documents"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center w-full p-6 bg-background z-50">
        <div className="md:ml-auto w-full justify-between md:justify-end flex items-center gap-x-2 text-muted-foreground">
          <p className="text-sm">Built by Ashis Kumar Mishra</p>
        </div>
      </div>
    </div>
  );
}
