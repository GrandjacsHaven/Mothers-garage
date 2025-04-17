"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Check, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { isStrongPassword, passwordsMatch } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [passwordMatchError, setPasswordMatchError] = useState("")
  const [uid, setUid] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get uid and token from URL parameters
    const uidParam = searchParams.get("uid")
    const tokenParam = searchParams.get("token")

    if (!uidParam || !tokenParam) {
      setError("Invalid password reset link. Please request a new one.")
      return
    }

    setUid(uidParam)
    setToken(tokenParam)
  }, [searchParams])

  // Check password match on change
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatchError("Passwords do not match.")
    } else {
      setPasswordMatchError("")
    }
  }, [password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!uid || !token) {
      setError("Invalid password reset link. Please request a new one.")
      return
    }

    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character.")
      return
    }

    if (!passwordsMatch(password, confirmPassword)) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      // Send all required fields to match backend expectations
      await api.resetPassword(uid, token, password, confirmPassword)
      setIsSuccess(true)
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      })

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: any) {
      console.error("Reset password error:", error)
      // Display the specific error message from the backend if available
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError("Failed to reset password. The link may have expired. Please request a new one.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <header className="px-6 py-4 bg-white border-b">
        <div className="container mx-auto">
          <Link href="/auth/login" className="inline-flex items-center text-gray-600 hover:text-[#FF00E1]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSuccess ? (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been reset successfully. Redirecting to login page...
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={passwordMatchError ? "border-red-500" : ""}
                  />
                  {passwordMatchError && <p className="text-xs text-red-500">{passwordMatchError}</p>}
                </div>

                <Button type="submit" className="w-full bg-[#FF00E1] hover:bg-[#FF00E1]/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-[#FF00E1] hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>

      <footer className="py-4 px-6 bg-white border-t">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mother&apos;s Garage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
