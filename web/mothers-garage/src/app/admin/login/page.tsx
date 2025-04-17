"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Lock } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function AdminLogin() {
  const [loginKey, setLoginKey] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Call API for admin login
      const response = await api.adminLogin(loginKey, password)
      localStorage.setItem("auth_token", response.token)
      localStorage.setItem("user_role", response.role)

      toast({
        title: "Login successful!",
        description: "You are now logged in as an administrator.",
        variant: "default",
      })

      // Use Next.js router.push for smooth client-side navigation.
      // A small delay (e.g., 500ms) ensures the toast is visible before redirect.
      setTimeout(() => {
        if (response.role === "super_admin") {
          router.push("/super-admin/dashboard")
        } else {
          router.push("/admin/dashboard")
        }
      }, 500)
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b">
        <div className="container mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-[#832D90]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#832D90]/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-[#832D90]" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Access the Mother&apos;s Garage admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-key">Username or Email</Label>
                <Input
                  id="login-key"
                  type="text"
                  placeholder="Enter your username or email"
                  value={loginKey}
                  onChange={(e) => setLoginKey(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#832D90] hover:bg-[#832D90]/90"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <p className="text-gray-500">
                This login is restricted to administrators only.
              </p>
            </div>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 bg-white border-t">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mother&apos;s Garage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
