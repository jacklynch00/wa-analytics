import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"

export default function HelpPage() {
  return (
    <DashboardLayout>
      <ComingSoon 
        feature="Help & Documentation" 
        description="Find guides, tutorials, and answers to frequently asked questions about using Waly Analytics."
      />
    </DashboardLayout>
  )
}