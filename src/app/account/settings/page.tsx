import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"

export default function AccountSettingsPage() {
  return (
    <DashboardLayout>
      <ComingSoon 
        feature="Account Settings" 
        description="Manage your personal account preferences, notifications, and security settings."
      />
    </DashboardLayout>
  )
}