import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <ComingSoon 
        feature="Global Analytics Overview" 
        description="View analytics across all your communities and get insights into your WhatsApp data."
      />
    </DashboardLayout>
  )
}