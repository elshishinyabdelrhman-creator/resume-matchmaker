import { redirect } from "next/navigation";

/** Legacy URL — the intake flow lives at `/new-job`. */
export default function LegacyNewApplicationPage() {
  redirect("/new-job");
}
