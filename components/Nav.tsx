import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "./SignOutButton";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <div className="navbar border-b border-base-200 bg-base-100 px-4">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl font-bold">
          ⚽ {APP_NAME}
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <Link href="/leagues" className="btn btn-ghost btn-sm">
          Discover
        </Link>
        {user ? (
          <>
            <Link href="/setup" className="btn btn-ghost btn-sm">
              New league
            </Link>
            <Link href="/chat" className="btn btn-ghost btn-sm">
              AI setup
            </Link>
            <span className="hidden text-sm opacity-60 sm:inline">
              {user.email}
            </span>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/sign-in" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
