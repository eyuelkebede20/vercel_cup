import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { SetupWizard } from "@/components/SetupWizard";

export default async function SetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create a league</h1>
      <SetupWizard />
    </div>
  );
}
