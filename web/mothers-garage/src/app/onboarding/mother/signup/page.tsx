"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "react-i18next"
import { isValidEmail, isStrongPassword, passwordsMatch, isValidPhoneNumber } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import dynamic from "next/dynamic"
import { PageContainer } from "@/components/page-container"

const InlineLocationPicker = dynamic(() => import("@/components/inline-location-picker"), { ssr: false })

export default function MotherSignup() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [tosModalOpen, setTosModalOpen] = useState(false)
  const [tosAgreed, setTosAgreed] = useState(false)

  // Location management
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)

  // OTP state
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [otpError, setOtpError] = useState("")

  const [phoneError, setPhoneError] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    age: "",
    weight: "",
    height: "",
    country: "Uganda",
    preferred_language: "English",
    postpartum_needs: "",
    infant_care_preferences: "",
    interest_ids: [] as number[],
  })

  const [interests, setInterests] = useState<{ id: number; name: string }[]>([
    { id: 1, name: "Teletherapy" },
    { id: 2, name: "Home Care" },
    { id: 3, name: "Nutrition" },
    { id: 4, name: "Mental Health" },
  ])

  const totalSteps = 5

  // Fetch interests from API
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const data = await api.getInterests()
        if (data && Array.isArray(data)) {
          setInterests(data)
        }
      } catch (error) {
        console.error("Error fetching interests:", error)
      }
    }

    fetchInterests()
  }, [])

  // ---------------------------------------
  // LOCATION: Default coordinates on load
  // ---------------------------------------
  useEffect(() => {
    if (!location) {
      const defaultLoc = {
        lat: 0.3476,
        lng: 32.5825,
        address: "Kampala, Uganda",
      }
      setLocation(defaultLoc)
    }
  }, [location])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target

    if (id === "phone_number") {
      setPhoneError("")
    }

    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCheckboxChange = (id: number, checked: boolean) => {
    setFormData((prev) => {
      const newInterestIds = [...prev.interest_ids]
      if (checked) {
        if (!newInterestIds.includes(id)) {
          newInterestIds.push(id)
        }
      } else {
        const index = newInterestIds.indexOf(id)
        if (index !== -1) {
          newInterestIds.splice(index, 1)
        }
      }
      return { ...prev, interest_ids: newInterestIds }
    })
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Callback from the map
  const handleLocationSelected = (loc: { lat: number; lng: number; address: string }) => {
    setLocation(loc)
  }

  // Allow user to get current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const loc = {
          lat,
          lng,
          address: "Current Location",
        }
        setLocation(loc)
      },
      (err) => {
        console.error(err)
        toast({ title: "Error", description: "Unable to retrieve your location", variant: "destructive" })
      },
    )
  }

  const nextStep = () => {
    if (!validateCurrentStep()) return
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        if (!formData.username.trim()) {
          toast({ title: "Error", description: "Username is required", variant: "destructive" })
          return false
        }
        if (!isValidEmail(formData.email)) {
          toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" })
          return false
        }
        if (!isStrongPassword(formData.password)) {
          toast({
            title: "Error",
            description:
              "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
            variant: "destructive",
          })
          return false
        }
        if (!passwordsMatch(formData.password, formData.password2)) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
          return false
        }
        if (!formData.phone_number.trim()) {
          setPhoneError("Phone number is required")
          toast({ title: "Error", description: "Phone number is required", variant: "destructive" })
          return false
        }
        if (!isValidPhoneNumber(formData.phone_number)) {
          setPhoneError("Please enter a valid phone number (e.g., +256700000000)")
          toast({
            title: "Error",
            description: "Please enter a valid phone number (e.g., +256700000000)",
            variant: "destructive",
          })
          return false
        }
        return true

      case 2:
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          toast({ title: "Error", description: "First name and last name are required", variant: "destructive" })
          return false
        }
        if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
          toast({ title: "Error", description: "Please enter a valid age", variant: "destructive" })
          return false
        }
        if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
          toast({ title: "Error", description: "Please enter a valid weight", variant: "destructive" })
          return false
        }
        if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
          toast({ title: "Error", description: "Please enter a valid height", variant: "destructive" })
          return false
        }
        return true

      case 3:
        if (!location) {
          toast({ title: "Error", description: "Please pin your location on the map", variant: "destructive" })
          return false
        }
        return true

      case 4:
        if (formData.interest_ids.length === 0) {
          toast({ title: "Error", description: "Please select at least one interest", variant: "destructive" })
          return false
        }
        if (!formData.postpartum_needs.trim()) {
          toast({ title: "Error", description: "Please describe your postpartum needs", variant: "destructive" })
          return false
        }
        if (!formData.infant_care_preferences.trim()) {
          toast({ title: "Error", description: "Please describe your infant care preferences", variant: "destructive" })
          return false
        }
        return true

      case 5:
        if (!tosAgreed) {
          toast({ title: "Error", description: "You must agree to the Terms of Service", variant: "destructive" })
          return false
        }
        return true

      default:
        return true
    }
  }

  // Helper to gracefully handle string vs. array-based errors:
  const getErrorMessage = (field: any) => (Array.isArray(field) ? field[0] : field)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Create user account (pending registration is created and OTP is automatically sent)
      await api.motherSignup({
        ...formData,
        pinned_location: location
          ? {
              lat: location.lat,
              lng: location.lng,
              address: location.address,
            }
          : null,
        tos_agreed: tosAgreed,
      })

      toast({
        title: "Account created!",
        description: "A verification code has been sent to your email.",
        variant: "default",
      })

      // Open OTP modal for user to enter the received code
      setOtpModalOpen(true)
    } catch (error: any) {
      console.error("Signup error:", error)
      // Provide error feedback to the user as needed
      if (error.response?.data) {
        const data = error.response.data
        if (data.username) {
          toast({
            title: "Error",
            description: Array.isArray(data.username) ? data.username[0] : data.username,
            variant: "destructive",
          })
        } else if (data.email) {
          toast({
            title: "Error",
            description: Array.isArray(data.email) ? data.email[0] : data.email,
            variant: "destructive",
          })
        } else if (data.detail) {
          toast({ title: "Error", description: data.detail, variant: "destructive" })
        } else {
          toast({
            title: "Error",
            description: "Failed to create account. Please check your input.",
            variant: "destructive",
          })
        }
      } else {
        toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOTP = async () => {
    setOtpError("")
    if (!otpCode.trim()) {
      setOtpError("Please enter the verification code")
      return
    }

    setIsVerifying(true)
    try {
      // Call the OTP verification endpoint; this creates the user and their profile using the pending registration data,
      // including the tos_agreed value.
      await api.verifyEmailOTP(formData.email, otpCode)

      toast({
        title: "Verification successful!",
        description: "Your email has been verified. Redirecting to Login...",
        variant: "default",
      })

      // Remove the call to updateMotherConsent since consent is already stored during signup.
      setOtpModalOpen(false)
      setTimeout(() => {
        router.push("/auth/login")
      }, 1500)
    } catch (error) {
      console.error("Verification error:", error)
      setOtpError("Invalid verification code. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendDisabled) return

    try {
      await api.requestEmailOTP(formData.email)
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
        variant: "default",
      })

      // Set the countdown duration to 20 seconds
      setResendDisabled(true)
      setResendCountdown(20)

      const countdownInterval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setResendDisabled(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error("Resend OTP error:", error)
      toast({
        title: "Failed to resend code",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <header className="px-6 py-4 bg-white border-b">
        <PageContainer>
          <Link href="/onboarding/user-type" className="inline-flex items-center text-gray-600 hover:text-[#FF00E1]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Selection
          </Link>
        </PageContainer>
      </header>

      <PageContainer className="flex-1 flex items-center justify-center py-6">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#FF00E1]">Sign Up as a Mother</CardTitle>
            <CardDescription>
              Step {step} of {totalSteps}:{" "}
              {step === 1
                ? "Account Information"
                : step === 2
                  ? "Personal Details"
                  : step === 3
                    ? "Location"
                    : step === 4
                      ? "Interests & Preferences"
                      : "Consent & Terms"}
            </CardDescription>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
              <div
                className="bg-[#FF00E1] h-2 rounded-full transition-all"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username*</Label>
                    <Input
                      id="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email*</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password*</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Confirm Password*</Label>
                    <Input
                      id="password2"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.password2}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number*</Label>
                  <Input
                    id="phone_number"
                    placeholder="Enter phone number (e.g., +256700000000)"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    className={phoneError ? "border-red-500" : ""}
                  />
                  {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name*</Label>
                    <Input
                      id="first_name"
                      placeholder="Enter first name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name*</Label>
                    <Input
                      id="last_name"
                      placeholder="Enter last name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age*</Label>
                    <Input
                      id="age"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)*</Label>
                    <Input
                      id="weight"
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      placeholder="Enter weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)*</Label>
                    <Input
                      id="height"
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      placeholder="Enter height"
                      value={formData.height}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country*</Label>
                    <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
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
                    <Label htmlFor="preferred_language">Preferred Language*</Label>
                    <Select
                      value={formData.preferred_language}
                      onValueChange={(value) => handleSelectChange("preferred_language", value)}
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
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please click the map to pin your location, or use your current location:
                </p>
                <InlineLocationPicker onLocationSelected={handleLocationSelected} initialLocation={location} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Interests*</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {interests.map((interest) => (
                      <div key={interest.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interest-${interest.id}`}
                          checked={formData.interest_ids.includes(interest.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(interest.id, checked === true)}
                        />
                        <label
                          htmlFor={`interest-${interest.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {interest.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postpartum_needs">Postpartum Needs*</Label>
                  <Textarea
                    id="postpartum_needs"
                    placeholder="Describe your postpartum needs (e.g., breastfeeding help)"
                    value={formData.postpartum_needs}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infant_care_preferences">Infant Care Preferences*</Label>
                  <Textarea
                    id="infant_care_preferences"
                    placeholder="Describe your infant care preferences"
                    value={formData.infant_care_preferences}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={tosAgreed}
                      onCheckedChange={(checked) => {
                        if (checked && !tosAgreed) {
                          setTosModalOpen(true)
                        } else {
                          setTosAgreed(false)
                        }
                      }}
                    />
                    <label htmlFor="terms" className="text-sm font-medium leading-none">
                      I agree to the{" "}
                      <button type="button" className="text-[#FF00E1] underline" onClick={() => setTosModalOpen(true)}>
                        Terms of Service
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {step < totalSteps ? (
              <Button onClick={nextStep} className="bg-[#FF00E1] hover:bg-[#FF00E1]/90">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-[#FF00E1] hover:bg-[#FF00E1]/90"
                onClick={handleSubmit}
                disabled={isSubmitting || !tosAgreed}
              >
                {isSubmitting ? "Submitting..." : "Complete Signup"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </PageContainer>

      {/* Terms of Service Modal */}
      <Dialog open={tosModalOpen} onOpenChange={setTosModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>Please read and agree to our Terms of Service</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh] border rounded-md p-4 text-sm">
            <h3 className="font-bold mb-2">1. Introduction</h3>
            <p className="mb-4">
              Welcome to Mother&apos;s Garage. By using our platform, you agree to these Terms of Service. Please read
              them carefully.
            </p>
            <h3 className="font-bold mb-2">2. Services</h3>
            <p className="mb-4">
              Mother&apos;s Garage provides a platform connecting mothers with qualified service providers. We do not
              provide the services directly but facilitate the connection between users.
            </p>
            <h3 className="font-bold mb-2">3. User Accounts</h3>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account information and for all activities
              that occur under your account.
            </p>
            <h3 className="font-bold mb-2">4. Privacy</h3>
            <p className="mb-4">
              Our Privacy Policy explains how we collect, use, and protect your personal information. By using our
              services, you agree to our data practices.
            </p>
            <h3 className="font-bold mb-2">5. Termination</h3>
            <p>
              We reserve the right to terminate or suspend your account at our discretion, without notice, for conduct
              that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTosModalOpen(false)}>
              Decline
            </Button>
            <Button
              className="bg-[#FF00E1] hover:bg-[#FF00E1]/90"
              onClick={() => {
                setTosAgreed(true)
                setTosModalOpen(false)
              }}
            >
              <Check className="mr-2 h-4 w-4" />I Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog
        open={otpModalOpen}
        onOpenChange={(open) => {
          if (!isVerifying) {
            setOtpModalOpen(open)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription>We&apos;ve sent a verification code to {formData.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {otpError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{otpError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code*</Label>
              <Input
                id="otp"
                placeholder="Enter verification code"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value)
                  setOtpError("")
                }}
                className={otpError ? "border-red-500" : ""}
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>Didn&apos;t receive the code?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendDisabled}
                className="text-[#FF00E1] hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendDisabled ? `Resend in ${resendCountdown}s` : "Resend code"}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#FF00E1] hover:bg-[#FF00E1]/90 w-full"
              onClick={handleVerifyOTP}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="py-4 px-6 bg-white border-t">
        <PageContainer>
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Mother&apos;s Garage. All rights reserved.</p>
          </div>
        </PageContainer>
      </footer>
    </div>
  )
}
