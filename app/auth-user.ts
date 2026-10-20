import { getUser } from "@netlify/identity";

export async function currentUser() {
  if (process.env.NODE_ENV === "development" && process.env.NETLIFY !== "true") {
    return { id: "local-seller", email: "Local seller", name: "Local seller" };
  }
  const user = await getUser();
  return user ? { id: user.id, email: user.email || "Seller", name: user.name || "" } : null;
}
