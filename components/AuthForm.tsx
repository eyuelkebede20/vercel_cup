"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = isSignUp
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Something went wrong.");
      return;
    }
    router.push("/setup");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-sm">
      <div className="card bg-base-100 shadow">
        <form className="card-body gap-3" onSubmit={handleSubmit}>
          <h1 className="card-title">
            {isSignUp ? "Create your admin account" : "Welcome back"}
          </h1>

          {isSignUp && (
            <label className="form-control">
              <div className="label">
                <span className="label-text">Name</span>
              </div>
              <input
                className="input input-bordered"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="form-control">
            <div className="label">
              <span className="label-text">Email</span>
            </div>
            <input
              type="email"
              className="input input-bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Password</span>
            </div>
            <input
              type="password"
              className="input input-bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </label>

          {error && (
            <div className="alert alert-error py-2 text-sm">{error}</div>
          )}

          <button
            className="btn btn-primary mt-2"
            disabled={loading}
            type="submit"
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {isSignUp ? "Sign up" : "Sign in"}
          </button>

          <p className="text-center text-sm opacity-70">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <Link href="/sign-in" className="link link-primary">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/sign-up" className="link link-primary">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
