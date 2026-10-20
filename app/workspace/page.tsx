import { redirect } from "next/navigation";
import { currentUser } from "../auth-user";
import Workspace from "./workspace";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const signOut = process.env.NODE_ENV === "development" && process.env.NETLIFY !== "true" ? "/" : "/logout";
  return <Workspace name={user.name} email={user.email} signOut={signOut} />;
}
