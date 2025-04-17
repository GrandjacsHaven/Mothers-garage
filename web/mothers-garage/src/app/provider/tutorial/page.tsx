"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatPriceForCountry } from "@/lib/utils"
import { LayoutDashboard, ListChecks, Calendar } from "lucide-react"

export default function ProviderTutorial() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [country, setCountry] = useState("US")
  const totalSteps = 3

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const data = await api.getSubscriptionStatus()
        setCountry(data.country)
      } catch (error) {
        console.error("Error fetching country:", error)
      }
    }

    fetchCountry()
  }, [])

  const nextStep = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      setIsLoading(true)
      try {
        await api.completeProviderTutorial()
        toast({
          title: "Tutorial completed",
          description: "You're now ready to set up your subscription plan.",
        })
        router.push("/provider/subscription")
      } catch (error) {
        console.error("Error completing tutorial:", error)
        toast({
          title: "Error",
          description: "Failed to complete tutorial. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-[#832D90]">Welcome to Mothers Garage!</CardTitle>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
            <div
              className="bg-[#832D90] h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <LayoutDashboard size={64} className="text-[#832D90]" />
              </div>
              <h3 className="font-bold text-lg">Your Modular Dashboard</h3>
              <p className="text-gray-700">
                Welcome to your provider dashboard! This is your central hub for managing your services, appointments,
                and client interactions.
              </p>
              <p className="text-gray-700">
                Each service module has its own dedicated workspace, allowing you to focus on specific aspects of your
                practice.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <ListChecks size={64} className="text-[#832D90]" />
              </div>
              <h3 className="font-bold text-lg">Subscription Plans</h3>
              <p className="text-gray-700">Mother&apos;s Garage offers three subscription tiers to meet your needs:</p>
              <div className="space-y-3 mt-2">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold">Basic (Free)</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    <li>Public profile listing</li>
                    <li>Maximum 5 bookings per month</li>
                    <li>Basic analytics</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg border-[#832D90] bg-[#832D90]/5">
                  <h4 className="font-semibold">Standard ({formatPriceForCountry(50, country)}/month)</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    <li>Public profile listing</li>
                    <li>Maximum 50 bookings per month</li>
                    <li>Enhanced analytics breakdown</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold">Premium ({formatPriceForCountry(100, country)}/month)</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    <li>Public profile listing</li>
                    <li>Unlimited bookings</li>
                    <li>Enhanced analytics breakdown</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <Calendar size={64} className="text-[#832D90]" />
              </div>
              <h3 className="font-bold text-lg">Booking Limitations</h3>
              <p className="text-gray-700">
                Your subscription plan determines how many bookings you can accept each month:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <span className="font-medium">Basic Plan:</span> Once you reach 5 bookings in a month, your profile
                  will be hidden from mother searches until the next month.
                </li>
                <li>
                  <span className="font-medium">Standard Plan:</span> You can accept up to 50 bookings per month.
                </li>
                <li>
                  <span className="font-medium">Premium Plan:</span> Enjoy unlimited bookings with no restrictions.
                </li>
              </ul>
              <p className="text-gray-700">
                Your dashboard will show your current booking count and days remaining in the current period.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={nextStep} className="bg-[#832D90] hover:bg-[#832D90]/90" disabled={isLoading}>
            {isLoading ? "Loading..." : step < totalSteps ? "Next" : "Complete Tutorial"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
