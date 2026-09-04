"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

const options = [
  {
    key: "updates",
    title: "Product updates",
    description: "Email me when new software ships or changes.",
  },
  {
    key: "incidents",
    title: "Incident updates",
    description: "Notify me when a Chhikara service degrades or recovers.",
  },
  {
    key: "billing",
    title: "Billing activity",
    description: "Plan changes, payment issues, and invoice availability.",
  },
  {
    key: "security",
    title: "Security events",
    description: "New sign-ins and security-related account changes.",
  },
]

export function SettingsNotificationsForm() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    updates: true,
    incidents: true,
    billing: true,
    security: true,
  })
  const [saved, setSaved] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose which emails the company sends you. Settings sync per account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {options.map((option) => (
          <div
            key={option.key}
            className="flex items-start justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
          >
            <div>
              <p className="font-medium text-sm">{option.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              checked={enabled[option.key]}
              onCheckedChange={(value) => {
                setEnabled((prev) => ({ ...prev, [option.key]: value }))
                setSaved(false)
              }}
              aria-label={`Toggle ${option.title}`}
            />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={() => setSaved(true)}>Save preferences</Button>
          {saved ? <span className="font-mono text-xs text-chart-2">saved ✓</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}