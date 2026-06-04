import { redirect } from "next/navigation";
import { LocalCuratorOnly } from "./local-only";

export default function CuratorPage() {
  if (process.env.NODE_ENV !== "development") {
    return <LocalCuratorOnly />;
  }

  redirect("/curator/exhibits");
}
