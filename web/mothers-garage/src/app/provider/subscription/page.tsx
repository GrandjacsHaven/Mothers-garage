"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Sparkles, Shield, Clock, Award } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatPriceForCountry } from "@/lib/utils"
import { PageContainer } from "@/components/page-container"

// Define subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    icon: Clock,
    description: "Perfect for getting started",
    features: ["Profile Listing", "Maximum 5 bookings per month", "Emergency Button", "Basic Analytics"],
    limitations: ["Limited visibility", "Profile hidden after booking limit reached"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 50,
    icon: Shield,
    description: "Great for growing providers",
    features: ["Profile Listing", "Maximum 50 bookings per month", "Emergency Button", "Enhanced Analytics Breakdown"],
    limitations: ["Profile hidden after booking limit reached"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 100,
    icon: Award,
    description: "For established professionals",
    features: [
      "Profile Listing",
      "Unlimited bookings",
      "Emergency Button",
      "Enhanced Analytics Breakdown",
      "Priority Support",
    ],
    limitations: [],
  },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<string>("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [userCountry, setUserCountry] = useState<string>("US")
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null)
  const [hasMounted, setHasMounted] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [subscriptionComplete, setSubscriptionComplete] = useState(false)

  useEffect(() => {
    setHasMounted(true)

    const fetchUserData = async () => {
      try {
        const data = await api.getSubscriptionStatus()
        setCurrentSubscription(data.subscription_plan)
        setUserCountry(data.country)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load your subscription information. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchUserData()
  }, [toast])

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setShowConfirmation(true)
  }

  // Handle free plan selection
  const handleSelectFreePlan = async () => {
    setIsLoading(true)
    try {
      await api.activateSubscription("basic")
      setSubscriptionComplete(true)
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast({
        title: "Error",
        description: "Failed to update your subscription. Please try again.",
        variant: "destructive",
      })
      setShowConfirmation(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle PayPal payment success
  const handlePaymentSuccess = async (data: any) => {
    setIsLoading(true)
    try {
      await api.activateSubscription(selectedPlan as "standard" | "premium")
      setSubscriptionComplete(true)
    } catch (error) {
      console.error("Error activating subscription:", error)
      toast({
        title: "Error",
        description: "Payment was successful, but we couldn't activate your subscription. Please contact support.",
        variant: "destructive",
      })
      setShowConfirmation(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    router.push("/provider/workspace-select")
  }

  const handleCloseModal = () => {
    if (subscriptionComplete) {
      router.push("/provider/workspace-select")
    } else {
      setShowConfirmation(false)
    }
  }

  const selectedPlanDetails = SUBSCRIPTION_PLANS.find((plan) => plan.id === selectedPlan)

  return (
    <PageContainer className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#832D90] mb-3">Choose Your Subscription Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Select the plan that best fits your needs. You can upgrade or downgrade at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const IconComponent = plan.icon
          return (
            <div
              key={plan.id}
              className={`subscription-card-container h-full ${selectedPlan === plan.id ? "scale-102 z-10" : ""}`}
            >
              <Card
                className={`subscription-card border-2 h-full flex flex-col ${
                  selectedPlan === plan.id
                    ? "border-[#832D90] shadow-lg"
                    : "border-gray-200 hover:border-[#832D90]/50 hover:shadow-md"
                } ${currentSubscription === plan.id ? "bg-[#832D90]/5" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-[#832D90] text-white m-2 px-3 py-1">
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4 bg-gray-50 border-b">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-[#832D90]/10">
                      <IconComponent className="h-6 w-6 text-[#832D90]" />
                    </div>
                  </div>
                  <CardTitle className="flex justify-between items-center text-xl text-center">
                    <span className="w-full">{plan.name}</span>
                  </CardTitle>
                  <CardDescription className="text-center">
                    <div className="mt-2 text-3xl font-bold text-[#832D90]">
                      {plan.price === 0 ? "Free" : formatPriceForCountry(plan.price, userCountry)}
                    </div>
                    <div className="text-xs text-gray-500">per month</div>
                    <div className="mt-1 text-xs">{plan.description}</div>
                  </CardDescription>
                  {currentSubscription === plan.id && (
                    <div className="mt-2 text-center">
                      <span className="text-xs bg-[#832D90] text-white px-3 py-1 rounded-full">Current Plan</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 py-4 flex-grow">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-700">Features</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-gray-700">Limitations</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start">
                            <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                            <span className="text-xs">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t bg-gray-50">
                  <Button
                    className={`w-full ${
                      selectedPlan === plan.id
                        ? "bg-[#832D90] hover:bg-[#832D90]/90"
                        : plan.popular
                          ? "bg-[#832D90]/90 text-white hover:bg-[#832D90]"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={(!!currentSubscription && currentSubscription === plan.id) || isLoading}
                  >
                    {currentSubscription === plan.id ? "Current Plan" : "Select Plan"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            {subscriptionComplete ? (
              <>
                <DialogTitle className="text-center text-2xl text-[#832D90]">Subscription Complete!</DialogTitle>
                <DialogDescription className="text-center">
                  Your subscription has been successfully activated.
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle>Confirm {selectedPlanDetails?.name} Plan</DialogTitle>
                <DialogDescription>
                  {selectedPlan === "basic"
                    ? "You're about to activate the free Basic plan."
                    : `You're about to subscribe to the ${selectedPlanDetails?.name} plan at ${formatPriceForCountry(selectedPlanDetails?.price || 0, userCountry)} per month.`}
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {subscriptionComplete ? (
            <div className="flex flex-col items-center py-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{selectedPlanDetails?.name} Plan Activated</h3>
              <p className="text-center text-gray-600 mb-6">
                You now have access to all the features included in your subscription.
              </p>
              <Button className="w-full bg-[#832D90] hover:bg-[#832D90]/90" onClick={handleContinue}>
                Continue to Workspace
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  {selectedPlanDetails && <selectedPlanDetails.icon className="h-5 w-5 text-[#832D90]" />}
                  <span className="font-medium">{selectedPlanDetails?.name} Plan</span>
                </div>
                <ul className="space-y-2">
                  {selectedPlanDetails?.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {selectedPlanDetails && selectedPlanDetails.features.length > 3 && (
                    <li className="text-sm text-gray-500">+ {selectedPlanDetails.features.length - 3} more features</li>
                  )}
                </ul>
              </div>

              <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                {selectedPlan === "basic" ? (
                  <Button
                    className="w-full bg-[#832D90] hover:bg-[#832D90]/90"
                    onClick={handleSelectFreePlan}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Activate Free Plan"
                    )}
                  </Button>
                ) : (
                  <div className="w-full overflow-hidden">
                    <PayPalScriptProvider
                      options={{
                        clientId: "AZD1ErVVH6cM_hUg_1UyB13kPixd_kp_JFEa8Dk7Zpq_WkctUjHWDK9fTeKexqd2bpMz9AgUU061sQzD",
                        currency: "USD",
                        intent: "capture",
                        // Enable both PayPal and credit card options
                        components: "buttons,payment-fields,marks,funding-eligibility",
                      }}
                    >
                      <div className="paypal-button-container">
                        <PayPalButtons
                          style={{
                            layout: "vertical",
                            shape: "rect",
                            height: 40,
                          }}
                          fundingSource={undefined} // This allows all funding sources including credit card
                          createOrder={(data, actions) => {
                            const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)
                            return actions.order.create({
                              intent: "CAPTURE",
                              purchase_units: [
                                {
                                  amount: {
                                    value: plan?.price.toString() || "0",
                                    currency_code: "USD",
                                  },
                                  description: `Mother's Garage ${plan?.name} Plan Subscription`,
                                },
                              ],
                            })
                          }}
                          onApprove={(data, actions) => {
                            return actions.order!.capture().then(async () => {
                              const orderId = data.orderID
                              try {
                                await api.paypalVerify({
                                  order_id: orderId,
                                  plan: selectedPlan,
                                })
                                setSubscriptionComplete(true)
                              } catch (error) {
                                console.error("Backend verification failed:", error)
                                toast({
                                  title: "Verification Failed",
                                  description:
                                    "Payment went through, but we couldn't verify it. Please contact support.",
                                  variant: "destructive",
                                })
                                setShowConfirmation(false)
                              }
                            })
                          }}
                          onError={(err) => {
                            console.error("PayPal Error:", err)
                            toast({
                              title: "Payment Error",
                              description: "There was an error processing your payment. Please try again.",
                              variant: "destructive",
                            })
                            setShowConfirmation(false)
                          }}
                        />
                      </div>
                    </PayPalScriptProvider>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={handleCloseModal}>
                  {subscriptionComplete ? "Close" : "Cancel"}
                </Button>

                <div className="text-center w-full">
                  <p className="text-xs text-gray-500 mt-2">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
