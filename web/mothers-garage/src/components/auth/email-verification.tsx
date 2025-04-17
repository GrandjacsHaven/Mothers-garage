"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useTranslation } from "react-i18next"
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react'

interface EmailVerificationProps {
  email?: string
  redirectUrl?: string
}

export function EmailVerification({ email: initialEmail, redirectUrl }: EmailVerificationProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [email, setEmail] = useState(initialEmail || "")
  const [otp, setOtp] = useState("")
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !otp) {
      toast({
        title: t("verification.missingFields"),
        description: t("verification.pleaseEnterEmailAndOtp"),
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    try {
      await api.verifyEmailOTP(email, otp)
      
      setIsVerified(true)
      
      toast({
        title: t("verification.success"),
        description: t("verification.emailVerified"),
      })
      
      // Redirect after a short delay
      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl)
        } else {
          router.push("/auth/login")
        }
      }, 3000)
    } catch (error) {
      console.error("Verification error:", error)
      
      toast({
        title: t("verification.failed"),
        description: t("verification.invalidOtp"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      toast({
        title: t("verification.missingEmail"),
        description: t("verification.pleaseEnterEmail"),
        variant: "destructive",
      })
      return
    }
    
    setIsResending(true)

    try {
      await api.requestEmailOTP(email)
      
      toast({
        title: t("verification.otpResent"),
        description: t("verification.checkEmailForOtp"),
      })
      
      // Set a 60-second countdown for resend button
      setCountdown(60)
    } catch (error) {
      console.error("Resend OTP error:", error)
      
      toast({
        title: t("verification.resendFailed"),
        description: t("verification.pleaseTryAgain"),
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isVerified ? t("verification.verified") : t("verification.verifyEmail")}
        </CardTitle>
        <CardDescription>
          {isVerified 
            ? t("verification.emailSuccessfullyVerified") 
            : t("verification.enterOtpSentToEmail")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isVerified ? (
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-center">{t("verification.redirecting")}</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder={t("verification.enterEmail")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!initialEmail || isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="otp"
                placeholder={t("verification.enterOtp")}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#FF00E1] hover:bg-[#FF00E1]/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("verification.verifying")}
                </>
              ) : (
                t("verification.verify")
              )}
            </Button>
          </form>
        )}
      </CardContent>
      {!isVerified && (
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-center" 
            onClick={handleResendOTP}
            disabled={isResending || countdown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("verification.resending")}
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("verification.resendIn", { seconds: countdown })}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("verification.resendOtp")}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}