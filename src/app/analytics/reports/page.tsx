import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"

export default function AnalyticsReportsPage() {
  return (
    <DashboardLayout>
      <ComingSoon 
        feature="Analytics Reports" 
        description="Generate and export detailed reports about your community data and engagement metrics."
      />
    </DashboardLayout>
  )
}