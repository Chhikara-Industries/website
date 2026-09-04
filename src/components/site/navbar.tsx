import { getCurrentUser } from "@/lib/dal"
import { NavbarClient } from "@/components/site/navbar-client"

export async function Navbar() {
  const user = await getCurrentUser()
  return <NavbarClient user={user} />
}