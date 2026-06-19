import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ChatSetup } from "@/components/ChatSetup";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI setup assistant</h1>
        <p className="text-sm opacity-60">
          Describe the league you want — I&apos;ll ask for anything missing, then
          build it.
        </p>
      </div>
      <ChatSetup />
    </div>
  );
}
