import { requireAdminFromRequest } from "@/lib/admin/requireAdminFromRequest"
import { adminOk } from "@/lib/admin/adminHttp"

export async function GET(req: Request) {
  const auth = await requireAdminFromRequest(req)
  if (!auth.ok) return auth.response

  return adminOk({
    user: {
      id: auth.user.id,
      email: auth.user.email,
    },
  })
}
