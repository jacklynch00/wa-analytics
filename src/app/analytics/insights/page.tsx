import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"

export default function AnalyticsInsightsPage() {
  return (
    <DashboardLayout>
      <ComingSoon 
        feature="Analytics Insights" 
        description="Get AI-powered insights and recommendations based on your WhatsApp community data."
      />
    </DashboardLayout>
  )
}