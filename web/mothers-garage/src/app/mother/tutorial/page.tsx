"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Home, HeartPulse, BookOpen, Users, Bot, Search, ArrowRight } from "lucide-react"

export default function MotherTutorial() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const totalSteps = 3

  const nextStep = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Complete tutorial
      setIsLoading(true)
      try {
        await api.completeMotherTutorial()
        toast({
          title: "Tutorial completed",
          description: "You're now ready to explore Mother's Garage!",
        })
        router.push("/mother/dashboard")
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-md border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-[#FF00E1]">Welcome to Mothers Garage!</CardTitle>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
            <div
              className="bg-[#FF00E1] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span className={step >= 1 ? "text-[#FF00E1] font-medium" : ""}>Getting Started</span>
            <span className={step >= 2 ? "text-[#FF00E1] font-medium" : ""}>Your Modules</span>
            <span className={step >= 3 ? "text-[#FF00E1] font-medium" : ""}>Finding Support</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <Home size={64} className="text-[#FF00E1]" />
              </div>
              <h3 className="font-bold text-xl text-[#FF00E1]">Your Dashboard</h3>
              <p className="text-gray-700">
                Welcome to Mother&apos;s Garage! This is your central hub for accessing all the services and resources
                available to you. Your dashboard is designed to make it easy to find the support you need during your
                motherhood journey.
              </p>
              <p className="text-gray-700">
                You&apos;ll find your upcoming appointments, notifications, and community updates all in one place.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-center gap-8 mb-6">
                <HeartPulse size={48} className="text-[#FF00E1]" />
                <BookOpen size={48} className="text-[#FF00E1]" />
                <Users size={48} className="text-[#FF00E1]" />
              </div>
              <h3 className="font-bold text-xl text-[#FF00E1]">Your Modules</h3>
              <p className="text-gray-700">Mother&apos;s Garage offers five key modules to support you:</p>
              <div className="space-y-3 mt-2">
                <div className="p-4 border rounded-lg flex items-center">
                  <HeartPulse className="h-5 w-5 text-[#FF00E1] mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Teletherapy</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Connect with therapists for virtual sessions to support your mental health.
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg flex items-center border-[#FF00E1] bg-[#FF00E1]/5">
                  <Home className="h-5 w-5 text-[#FF00E1] mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Home Care</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Schedule in-home care services from qualified providers.
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg flex items-center">
                  <BookOpen className="h-5 w-5 text-[#FF00E1] mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">E-Learning</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Access courses and resources to help you navigate motherhood.
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg flex items-center">
                  <Users className="h-5 w-5 text-[#FF00E1] mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Social Networking</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Connect with other mothers to share experiences and support.
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg flex items-center">
                  <Bot className="h-5 w-5 text-[#FF00E1] mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">AI for Mothers</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Get AI-powered assistance for common questions and concerns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <Search size={64} className="text-[#FF00E1]" />
              </div>
              <h3 className="font-bold text-xl text-[#FF00E1]">Finding Providers</h3>
              <p className="text-gray-700">
                When you select a module, you&apos;ll see providers who offer that specific service in your area.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-[#FF00E1]/10 p-2 rounded-full mr-3 mt-0.5">
                    <Search className="h-4 w-4 text-[#FF00E1]" />
                  </div>
                  <div>
                    <span className="font-medium">Browse Profiles:</span> View provider profiles, ratings, and
                    specialties.
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#FF00E1]/10 p-2 rounded-full mr-3 mt-0.5">
                    <Search className="h-4 w-4 text-[#FF00E1]" />
                  </div>
                  <div>
                    <span className="font-medium">Book Appointments:</span> Schedule sessions directly through the
                    platform.
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#FF00E1]/10 p-2 rounded-full mr-3 mt-0.5">
                    <Search className="h-4 w-4 text-[#FF00E1]" />
                  </div>
                  <div>
                    <span className="font-medium">Communicate:</span> Message providers securely through our platform.
                  </div>
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                You&apos;re now ready to explore Mother&apos;s Garage and find the support you need!
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button
            onClick={nextStep}
            className="bg-[#FF00E1] hover:bg-[#FF00E1]/90 text-white px-5"
            disabled={isLoading}
          >
            {isLoading ? (
              "Loading..."
            ) : step < totalSteps ? (
              <span className="flex items-center">
                Next <ArrowRight size={16} className="ml-2" />
              </span>
            ) : (
              <span className="flex items-center">
                Get Started <ArrowRight size={16} className="ml-2" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
