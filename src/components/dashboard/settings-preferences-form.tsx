"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export function SettingsPreferencesForm() {
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [saved, setSaved] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Dashboard-wide settings that live on your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value)
              setSaved(false)
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
          >
            <option>Asia/Kolkata</option>
            <option>UTC</option>
            <option>Europe/London</option>
            <option>America/New_York</option>
            <option>America/Los_Angeles</option>
            <option>Asia/Tokyo</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Used for dates and times across your account.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 font-mono text-xs text-muted-foreground">
          theme: dark-first (system-determined) · language: en-US
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setSaved(true)}>Save preferences</Button>
          {saved ? <span className="font-mono text-xs text-chart-2">saved ✓</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}