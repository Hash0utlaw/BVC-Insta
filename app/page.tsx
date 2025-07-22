import { redirect } from "next/navigation"

export default function RootPage() {
  // When a user visits the root of the site,
  // they will be automatically redirected to the main curation dashboard.
  redirect("/curate")
}
