"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription as CardDescriptionComponent,
  CardFooter as CardFooterComponent,
  CardHeader as CardHeaderComponent,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call API for login
      const response = await api.login(email, password)

      // Store token
      localStorage.setItem("access_token", response.access)
      localStorage.setItem("refresh_token", response.refresh)

      // Set token to Authorization header for future API calls
      api.setAuthToken(response.access)

      // Check if it's their first login
      let firstTimeCheckResponse
      if (response.user_type === "mother") {
        firstTimeCheckResponse = await api.checkMotherFirstTimeLogin()
      } else {
        firstTimeCheckResponse = await api.checkFirstTimeLogin() // for provider
      }

      toast({
        title: "Login successful!",
        description: "You are now logged in.",
      })

      // Redirect to tutorial if it's the first time
      if (firstTimeCheckResponse.first_time_login) {
        window.location.href = response.user_type === "mother" ? "/mother/tutorial" : "/provider/tutorial"
      } else {
        // Otherwise go to the dashboard
        window.location.href = response.user_type === "mother" ? "/mother/dashboard" : "/provider/workspace-select"
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <header className="px-6 py-4 bg-white border-b">
        <div className="container mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-[#FF00E1]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeaderComponent className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescriptionComponent>Login to access your Mother&apos;ss Garage account</CardDescriptionComponent>
          </CardHeaderComponent>
          <CardContent>
            <Tabs defaultValue="mother" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="mother" className="data-[state=active]:bg-[#FF00E1] data-[state=active]:text-white">
                  Mother
                </TabsTrigger>
                <TabsTrigger
                  value="provider"
                  className="data-[state=active]:bg-[#832D90] data-[state=active]:text-white"
                >
                  Service Provider
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mother">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-mother">Email</Label>
                    <Input
                      id="email-mother"
                      type="text"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-mother">Password</Label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordModalOpen(true)}
                        className="text-xs text-[#FF00E1] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password-mother"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#FF00E1] hover:bg-[#FF00E1]/90" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="provider">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-provider">Email</Label>
                    <Input
                      id="email-provider"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-provider">Password</Label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordModalOpen(true)}
                        className="text-xs text-[#832D90] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password-provider"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#832D90] hover:bg-[#832D90]/90" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooterComponent className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Don&apos;st have an account?{" "}
              <Link href="/onboarding/user-type" className="text-[#FF00E1] hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooterComponent>
        </Card>
      </main>

      <footer className="py-4 px-6 bg-white border-t">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mother&apos;ss Garage. All rights reserved.</p>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={forgotPasswordModalOpen} onClose={() => setForgotPasswordModalOpen(false)} />
    </div>
  )
}
