"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SettingsData {
  email: string
  age: string
  weight: string
  height: string
  postpartum_needs: string
  infant_care_preferences: string
  old_password?: string
  new_password?: string
  confirm_new_password?: string
  country?: string
  preferred_language?: string
}

export default function MotherSettings() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<SettingsData>({
    email: "",
    age: "",
    weight: "",
    height: "",
    postpartum_needs: "",
    infant_care_preferences: "",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const data = await api.getMotherSettings()
        setFormData(data)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      // 🟨 Filter out password fields if any of them is missing
      const submitData = { ...formData }
      if (!submitData.old_password || !submitData.new_password || !submitData.confirm_new_password) {
        delete submitData.old_password
        delete submitData.new_password
        delete submitData.confirm_new_password
      }

      await api.updateMotherSettings(submitData)

      toast({
        title: "Success",
        description: "Your settings have been updated successfully.",
      })

      // 🟩 Clear password fields after success
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
        confirm_new_password: "",
      }))
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const goBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#832D90]" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-6 pl-0 text-gray-500 hover:text-[#832D90] hover:bg-transparent"
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-[#832D90]/5 border-b">
          <CardTitle className="text-2xl text-[#832D90]">Account Settings</CardTitle>
          <CardDescription>Update your personal information and preferences</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" name="height" type="number" value={formData.height} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country || "Uganda"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Select
                    value={formData.preferred_language || "English"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, preferred_language: value }))}
                  >
                    <SelectTrigger id="preferred_language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Care Preferences</h3>

              <div className="space-y-2">
                <Label htmlFor="postpartum_needs">Postpartum Needs</Label>
                <Textarea
                  id="postpartum_needs"
                  name="postpartum_needs"
                  value={formData.postpartum_needs}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe any specific postpartum needs you have..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="infant_care_preferences">Infant Care Preferences</Label>
                <Textarea
                  id="infant_care_preferences"
                  name="infant_care_preferences"
                  value={formData.infant_care_preferences}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your preferences for infant care..."
                />
              </div>
            </div>
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-medium">Change Password</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="old_password">Old Password</Label>
                  <Input
                    id="old_password"
                    name="old_password"
                    type="password"
                    value={formData.old_password || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                  <Input
                    id="confirm_new_password"
                    name="confirm_new_password"
                    type="password"
                    value={formData.confirm_new_password || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={goBack}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#832D90] hover:bg-[#832D90]/90" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
