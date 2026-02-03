import { redirect } from "next/navigation";

export default function ScoringRedirectPage() {
  redirect("/app/settings/scoring");
}
