import { redirect } from 'next/navigation'

// /admin itself has no content; middleware has already gated access.
export const dynamic = 'force-dynamic'
export default function AdminHome() { redirect('/admin/signups') }
