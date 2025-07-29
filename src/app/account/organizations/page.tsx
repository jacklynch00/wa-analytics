import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"

export default function OrganizationSwitchingPage() {
  return (
    <DashboardLayout>
      <ComingSoon 
        feature="Organization Switching" 
        description="Switch between different organizations you belong to and manage your memberships."
      />
    </DashboardLayout>
  )
}