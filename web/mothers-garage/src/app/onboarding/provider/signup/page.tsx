"use client"
// Force client-side rendering, disabling static generation
import { CardFooter } from "@/components/ui/card"

import dynamic from "next/dynamic"
const InlineLocationPicker = dynamic(() => import("@/components/inline-location-picker"), {
  ssr: false,
})

const FileUpload = dynamic(() => import("@/components/file-upload"), { ssr: false })
import axios from "axios"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
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

// Import the PageContainer component at the top with the other imports
import { PageContainer } from "@/components/page-container"

// ─────────────────────────────────────────────────────────────
// Add all the 'Select' UI imports from your local library:
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

// ─────────────────────────────────────────────────────────────
// Service option interface
interface ServiceOption {
  id: number
  name: string
  specialities: { id: number; name: string }[]
}

// ─────────────────────────────────────────────────────────────
export default function ProviderSignup() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()

  // Step management – total steps increased to 6.
  const [step, setStep] = useState<number>(1)
  const totalSteps = 6

  // Modal states for Terms of Service
  const [tosModalOpen, setTosModalOpen] = useState<boolean>(false)
  const [tosAgreed, setTosAgreed] = useState<boolean>(false)

  // Location state
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  // OTP and submission states
  const [otpModalOpen, setOtpModalOpen] = useState<boolean>(false)
  const [otpCode, setOtpCode] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [resendDisabled, setResendDisabled] = useState<boolean>(false)
  const [resendCountdown, setResendCountdown] = useState<number>(0)
  const [verificationComplete, setVerificationComplete] = useState<boolean>(false)
  const [otpError, setOtpError] = useState<string>("")
  const [phoneError, setPhoneError] = useState<string>("")

  // File uploads for certificates
  const [selectedCertificates, setSelectedCertificates] = useState<File[]>([])

  // Service selection state
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([])
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<Record<number, number[]>>({})

  // Basic form data (including country and preferred_language)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    bio: "",
    license_number: "",
    associated_clinic: "",
    service_type_ids: [] as number[],
    provider_type_ids: [] as number[],
    country: "",
    preferred_language: "English",
  })

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  // Fetch service options on mount
  useEffect(() => {
    const fetchServiceOptions = async () => {
      try {
        const data = await api.getSpecialitiesByService()
        setServiceOptions(data)
      } catch (error) {
        console.error("Error fetching service options:", error)
        toast({
          title: "Error",
          description: "Failed to load service options",
          variant: "destructive",
        })
      }
    }
    fetchServiceOptions()
  }, [toast])

  // Default location on load
  useEffect(() => {
    if (!location) {
      setLocation({
        lat: 0.3476,
        lng: 32.5825,
        address: "Kampala, Uganda",
      })
    }
  }, [location])

  // Handle text/textarea input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (id === "phone_number") {
      setPhoneError("")
    }
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Step navigation
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

  // Validate the current step of the form
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
        if (selectedServiceIds.length === 0) {
          toast({ title: "Error", description: "Please select at least one service", variant: "destructive" })
          return false
        }
        for (const serviceId of selectedServiceIds) {
          if (!selectedSpecialtyIds[serviceId] || selectedSpecialtyIds[serviceId].length === 0) {
            const serviceName = serviceOptions.find((s) => s.id === serviceId)?.name || "selected service"
            toast({
              title: "Error",
              description: `Please select at least one specialty for ${serviceName}`,
              variant: "destructive",
            })
            return false
          }
        }
        return true
      case 3:
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          toast({ title: "Error", description: "First name and last name are required", variant: "destructive" })
          return false
        }
        if (!formData.bio.trim()) {
          toast({ title: "Error", description: "Professional bio is required", variant: "destructive" })
          return false
        }
        if (!formData.license_number.trim()) {
          toast({ title: "Error", description: "License number is required", variant: "destructive" })
          return false
        }
        if (selectedCertificates.length === 0) {
          toast({ title: "Error", description: "Please upload at least one certificate", variant: "destructive" })
          return false
        }
        return true
      case 4:
        if (!formData.country.trim()) {
          toast({ title: "Error", description: "Please select your country", variant: "destructive" })
          return false
        }
        if (!formData.preferred_language.trim()) {
          toast({ title: "Error", description: "Please select your preferred language", variant: "destructive" })
          return false
        }
        return true
      case 5:
        if (!location) {
          toast({ title: "Error", description: "Please pin your service location on the map", variant: "destructive" })
          return false
        }
        return true
      case 6:
        if (!tosAgreed) {
          toast({ title: "Error", description: "You must agree to the Terms of Service", variant: "destructive" })
          return false
        }
        return true
      default:
        return true
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return
    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("username", formData.username)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("password2", formData.password2)
      formDataToSend.append("phone_number", formData.phone_number)
      formDataToSend.append("first_name", formData.first_name)
      formDataToSend.append("last_name", formData.last_name)
      formDataToSend.append("bio", formData.bio)
      formDataToSend.append("license_number", formData.license_number)
      formDataToSend.append("associated_clinic", formData.associated_clinic)
      formDataToSend.append("country", formData.country)
      formDataToSend.append("preferred_language", formData.preferred_language)

      if (location) {
        formDataToSend.append("pinned_location", JSON.stringify({ lat: location.lat, lng: location.lng }))
      }

      selectedServiceIds.forEach((id) => {
        formDataToSend.append("service_type_ids", String(id))
      })
      Object.values(selectedSpecialtyIds)
        .flat()
        .forEach((id) => {
          formDataToSend.append("speciality_ids", String(id))
        })

      selectedCertificates.forEach((file) => {
        formDataToSend.append("certificates", file)
      })

      await api.providerSignupPending(formDataToSend)

      toast({
        title: "Application submitted!",
        description:
          "Your application has been received and is pending admin review. You will receive an email when your account is approved.",
        variant: "default",
      })
      setVerificationComplete(true)
    } catch (error) {
      console.error("Signup error:", error)
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data
        console.error("Backend error response:", responseData)
        let errorMessage = "Something went wrong. Please try again."
        if (typeof responseData === "string") {
          errorMessage = responseData
        } else if (responseData?.detail) {
          errorMessage = responseData.detail
        } else if (typeof responseData === "object" && responseData !== null) {
          const formatted = Object.entries(responseData)
            .map(([field, issues]) => {
              const messages =
                Array.isArray(issues) && typeof issues[0] === "string" ? issues.join(", ") : "Invalid input"
              return `• ${field}: ${messages}`
            })
            .join("\n")
          errorMessage = `Please fix the following issues:\n${formatted}`
        }
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signup Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported in SSR or your browser",
        variant: "destructive",
      })
      return
    }

    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setLocation({ lat, lng, address: "Current Location" })
      setCurrentLocation({ lat, lng, address: "Current Location" })
    }

    const error = (err: GeolocationPositionError) => {
      console.error(err)
      toast({ title: "Error", description: "Unable to retrieve your location", variant: "destructive" })
    }

    navigator.geolocation.getCurrentPosition(success, error)
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <header className="bg-white border-b py-4">
        <PageContainer>
          <Link href="/onboarding/user-type" className="inline-flex items-center text-gray-600 hover:text-[#832D90]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Selection
          </Link>
        </PageContainer>
      </header>

      <PageContainer className="flex-1 flex items-center justify-center">
        {verificationComplete ? (
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-[#832D90]">Application Submitted</CardTitle>
              <CardDescription>Your application is pending review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-[#832D90]/10 p-4 rounded-lg border border-[#832D90]/20">
                <p className="text-gray-700">
                  Thank you for applying as a service provider. Your application is pending review by our admin team.
                  You will receive an email when your account is approved.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What happens next?</h3>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Our admin team will review your professional details and certificates</li>
                  <li>You’ll receive an email notification once your account is approved</li>
                  <li>After approval, you can log in with your email and password</li>
                </ol>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  If you have any questions, please contact our support team at support@mothersgarage.com
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-[#832D90] hover:bg-[#832D90]/90" onClick={() => router.push("/")}>
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl shadow-lg mx-4 sm:mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-[#832D90]">Sign Up as a Service Provider</CardTitle>
              <CardDescription>
                Step {step} of {totalSteps}:{" "}
                {step === 1
                  ? "Account Information"
                  : step === 2
                    ? "Service Selection"
                    : step === 3
                      ? "Professional Details"
                      : step === 4
                        ? "Country & Language"
                        : step === 5
                          ? "Location"
                          : "Consent"}
              </CardDescription>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
                <div
                  className="bg-[#832D90] h-2 rounded-full transition-all"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </CardHeader>

            <CardContent>
              {/* STEP 1: Account Information */}
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

              {/* E. Update the service selection UI in step 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Services*</Label>
                    <p className="text-sm text-gray-500">Choose the services you want to offer</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {serviceOptions.map((service) => (
                        <div
                          key={service.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedServiceIds.includes(service.id)
                              ? "border-[#832D90] bg-[#832D90]/5"
                              : "border-gray-200 hover:border-[#832D90]/50"
                          }`}
                          onClick={() => {
                            // Toggle selection
                            if (selectedServiceIds.includes(service.id)) {
                              setSelectedServiceIds((prev) => prev.filter((id) => id !== service.id))
                              // Remove specialties for this service if de-selected
                              setSelectedSpecialtyIds((prev) => {
                                const newState = { ...prev }
                                delete newState[service.id]
                                return newState
                              })
                            } else {
                              setSelectedServiceIds((prev) => [...prev, service.id])
                              // Initialize with empty array for specialties
                              setSelectedSpecialtyIds((prev) => ({ ...prev, [service.id]: [] }))
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedServiceIds.includes(service.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedServiceIds((prev) => [...prev, service.id])
                                  setSelectedSpecialtyIds((prev) => ({ ...prev, [service.id]: [] }))
                                } else {
                                  setSelectedServiceIds((prev) => prev.filter((id) => id !== service.id))
                                  setSelectedSpecialtyIds((prev) => {
                                    const newState = { ...prev }
                                    delete newState[service.id]
                                    return newState
                                  })
                                }
                              }}
                            />
                            <Label className="font-medium cursor-pointer">{service.name}</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedServiceIds.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Select Specialties*</Label>
                      <p className="text-sm text-gray-500">Choose your areas of expertise for each selected service</p>
                      <div className="space-y-4 mt-2">
                        {/* Use a Set to ensure we only render each service once */}
                        {Array.from(new Set(selectedServiceIds)).map((serviceId) => {
                          const serviceOption = serviceOptions.find((s) => s.id === serviceId)
                          if (!serviceOption) return null
                          return (
                            <div key={serviceId} className="border rounded-lg p-4">
                              <h3 className="font-medium text-[#832D90] mb-3">{serviceOption.name} Specialties</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {serviceOption.specialities.map((specialty) => (
                                  <div key={specialty.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={selectedSpecialtyIds[serviceId]?.includes(specialty.id) || false}
                                      onCheckedChange={(checked) => {
                                        setSelectedSpecialtyIds((prev) => {
                                          const current = prev[serviceId] || []
                                          if (checked) {
                                            return { ...prev, [serviceId]: [...current, specialty.id] }
                                          } else {
                                            return { ...prev, [serviceId]: current.filter((id) => id !== specialty.id) }
                                          }
                                        })
                                      }}
                                    />
                                    <Label className="text-sm cursor-pointer">{specialty.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Professional Details */}
              {step === 3 && (
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
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio*</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your professional background and experience"
                      className="min-h-[100px]"
                      value={formData.bio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number*</Label>
                    <Input
                      id="license_number"
                      placeholder="Enter your professional license number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <FileUpload
                    id="certificates"
                    label="Upload Certificates (PDF)*"
                    accept=".pdf"
                    multiple={true}
                    onChange={(files) => setSelectedCertificates(files)}
                    value={selectedCertificates}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="associated_clinic">Associated Clinic (Optional)</Label>
                    <Input
                      id="associated_clinic"
                      placeholder="Enter associated clinic"
                      value={formData.associated_clinic}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Country & Preferred Language */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country*</Label>
                      <Select
                        value={formData.country}
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
                      <Label htmlFor="preferred_language">Preferred Language*</Label>
                      <Select
                        value={formData.preferred_language}
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
              )}

              {/* STEP 5: Location */}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Pin your location on the map or use your current location:</p>
                  <InlineLocationPicker onLocationSelected={(loc) => setLocation(loc)} initialLocation={location} />
                  <Button variant="outline" onClick={handleUseCurrentLocation}>
                    Use Current Location
                  </Button>
                </div>
              )}

              {/* STEP 6: Consent */}
              {step === 6 && (
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
                        <button
                          type="button"
                          className="text-[#832D90] underline"
                          onClick={() => setTosModalOpen(true)}
                        >
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
                <Button onClick={nextStep} className="bg-[#832D90] hover:bg-[#832D90]/90">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="bg-[#832D90] hover:bg-[#832D90]/90"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !tosAgreed}
                >
                  {isSubmitting ? "Submitting..." : "Complete Signup"}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
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
              className="bg-[#832D90] hover:bg-[#832D90]/90"
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

      {/* Tutorial Dialog */}
      <Dialog open={false}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#832D90]">Welcome to Mother&apos;s Garage!</DialogTitle>
            <DialogDescription>Let&apos;s get you started as a service provider</DialogDescription>
          </DialogHeader>
          {/* Tutorial steps can be implemented here if needed */}
          <DialogFooter>
            <Button className="bg-[#832D90] hover:bg-[#832D90]/90">Get Started</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="bg-white border-t py-6">
        <PageContainer className="text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mother&apos;s Garage. All rights reserved.</p>
        </PageContainer>
      </footer>
    </div>
  )
}

// Example of a ModuleCard with no errors
function ModuleCard({
  icon,
  title,
  description,
  color,
  onClick,
  isSelected,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
  isSelected: boolean
}) {
  return (
    <Card
      className={`border-none shadow-md hover:shadow-lg transition-all hover:translate-y-[-5px] overflow-hidden cursor-pointer ${
        isSelected ? "ring-2 ring-[#832D90]" : ""
      }`}
      onClick={onClick}
    >
      <div className="h-2 w-full" style={{ backgroundColor: color }} />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button className="w-full text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: color }}>
          Access Module
        </Button>
      </CardFooter>
    </Card>
  )
}
