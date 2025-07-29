import { Alert, AlertDescription } from "@/components/ui/alert"
import { Construction } from "lucide-react"

interface ComingSoonProps {
  feature: string
  description?: string
}

export function ComingSoon({ feature, description }: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Alert className="max-w-md">
        <Construction className="h-4 w-4" />
        <AlertDescription className="text-center">
          <div className="font-semibold mb-2">{feature} - Coming Soon</div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </AlertDescription>
      </Alert>
    </div>
  )
}