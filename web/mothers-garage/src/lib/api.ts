import axios, { type AxiosError, type AxiosRequestConfig } from "axios"
import { toast } from "@/components/ui/use-toast"

// Create Axios instance with base URL
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
})

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from secure storage
    const token = localStorage.getItem("access_token")

    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for handling token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Get refresh token
        const refreshToken = localStorage.getItem("refresh_token")

        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = "/auth/login"
          return Promise.reject(error)
        }

        // Attempt to refresh token
        const response = await axios.post("/auth/refresh", {
          refresh: refreshToken,
        })

        // If successful, update tokens
        if (response.data.access) {
          localStorage.setItem("access_token", response.data.access)

          // Update Authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`
          }

          // Retry the original request
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/auth/login"
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    handleApiError(error)
    return Promise.reject(error)
  },
)

// Error handler function
const handleApiError = (error: AxiosError) => {
  const status = error.response?.status
  const data = error.response?.data as any

  let errorMessage = "An unexpected error occurred"

  if (data?.detail) {
    errorMessage = data.detail
  } else if (data?.message) {
    errorMessage = data.message
  } else if (data?.error) {
    errorMessage = data.error
  } else if (status === 404) {
    errorMessage = "Resource not found"
  } else if (status === 403) {
    errorMessage = "You do not have permission to perform this action"
  } else if (status === 500) {
    errorMessage = "Server error. Please try again later"
  }

  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  })
}
const setAuthToken = (token: string) => {
  axiosInstance.defaults.headers.Authorization = `Bearer ${token}`
}
// API endpoints
export const api = {
  // Landing
  getLandingData: async () => {
    const response = await axiosInstance.get("/onboarding/landing")
    return response.data
  },

  // User Type Selection
  selectUserType: async (userType: "mother" | "provider") => {
    const response = await axiosInstance.post("/onboarding/select_user_type", {
      user_type: userType,
    })
    return response.data
  },

  // Mother Onboarding
  getInterests: async () => {
    const response = await axiosInstance.get("/onboarding/interests")
    return response.data
  },

  motherSignup: async (data: any) => {
    const response = await axiosInstance.post("/onboarding/mother_signup", data)
    return response.data
  },

  requestEmailOTP: async (email: string) => {
    const response = await axiosInstance.post("/onboarding/request_email_otp", { email })
    return response.data
  },

  verifyEmailOTP: async (email: string, code: string) => {
    const response = await axiosInstance.post("/onboarding/verify_email_otp", { email, code })
    return response.data
  },

  updateMotherConsent: async (hasAgreedToTerms: boolean) => {
    const response = await axiosInstance.patch("/onboarding/mother_consent", {
      has_agreed_to_terms: hasAgreedToTerms,
    })
    return response.data
  },

  getMotherDashboard: async () => {
    const response = await axiosInstance.get("/onboarding/mother_dashboard")
    return response.data
  },

  getMotherSettings: async () => {
    const response = await axiosInstance.get("/onboarding/mother_settings")
    return response.data
  },

  updateMotherSettings: async (data: any) => {
    const response = await axiosInstance.patch("/onboarding/mother_settings", data)
    return response.data
  },

  // Provider Onboarding
  getServiceTypes: async () => {
    const response = await axiosInstance.get("/onboarding/service_types")
    return response.data
  },

  getProviderTypes: async (serviceTypeId?: number) => {
    let url = "/onboarding/provider_types"
    if (serviceTypeId) {
      url += `?service_type_id=${serviceTypeId}`
    }
    const response = await axiosInstance.get(url)
    return response.data
  },

  providerSignup: async (data: any) => {
    const response = await axiosInstance.post("/onboarding/provider_signup", data)
    return response.data
  },

  // New endpoint for pending provider signup using FormData (overriding JSON headers)
  providerSignupPending: async (formData: FormData) => {
    const response = await axiosInstance.post("/onboarding/provider_signup_pending", formData)
    return response.data
  },

  providerSubscription: async (plan: "basic" | "standard" | "premium") => {
    const response = await axiosInstance.post("/onboarding/provider_subscription", { plan })
    return response.data
  },

  // // Updated Provider endpoints to match the exact URLs
  // getProviderDashboard: async () => {
  //   const response = await axiosInstance.get("/onboarding/provider_dashboard")
  //   return response.data
  // },

  getProviderSettings: async () => {
    const response = await axiosInstance.get("/onboarding/provider_settings")
    return response.data
  },

  updateProviderSettings: async (data: any) => {
    const response = await axiosInstance.patch("/onboarding/provider_settings", data)
    return response.data
  },

  // Authentication
  login: async (loginKey: string, password: string) => {
    const response = await axiosInstance.post("/auth/login", { login_key: loginKey, password })
    return response.data
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axiosInstance.post("/auth/refresh", { refresh: refreshToken })
    return response.data
  },

  logout: async (refreshToken: string) => {
    const response = await axiosInstance.post("/auth/logout", { refresh: refreshToken })
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await axiosInstance.post("/auth/forgot_password", { email })
    return response.data
  },

  resetPassword: async (uid: string, token: string, password: string, password2: string) => {
    const response = await axiosInstance.post("/auth/reset-password", {
      uid,
      token,
      password,
      password2,
    })
    return response.data
  },

  // Additional Admin Endpoints

  // Admin login
  adminLogin: async (loginKey: string, password: string) => {
    const response = await axiosInstance.post("/auth/admin_login", {
      username: loginKey, // Make sure this field name matches what your API expects
      password,
    })

    // Store tokens properly after successful login
    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token)
      localStorage.setItem("access_token", response.data.token) // For consistency with request interceptor
    }

    // Store the role (this was missing)
    if (response.data.role) {
      localStorage.setItem("user_role", response.data.role)
    }

    return response.data
  },

  // Admin approve provider
  approveProvider: async (providerId: number) => {
    return await axiosInstance.post("/onboarding/admin_approve_provider", {
      pending_id: providerId,
    })
  },

  // Super admin create admin user
  createAdminUser: async (data: {
    username: string
    email: string
    first_name: string
    last_name: string
    password: string
    confirm_password: string
  }) => {
    const response = await axiosInstance.post("/onboarding/create_admin_user", data)
    return response.data
  },

  // Get pending provider applications
  getPendingProviders: async () => {
    const response = await axiosInstance.get("/onboarding/admin_approve_provider")
    return response.data
  },

  // Updated Provider tutorial endpoints
  checkFirstTimeLogin: async () => {
    const response = await axiosInstance.get("/payments/check_first_time")
    return response.data
  },

  completeProviderTutorial: async () => {
    const response = await axiosInstance.post("/payments/complete_tutorial")
    return response.data
  },

  // Mother tutorial
  checkMotherFirstTimeLogin: async () => {
    const response = await axiosInstance.get("/onboarding/check_mother_first_time")
    return response.data
  },

  completeMotherTutorial: async () => {
    const response = await axiosInstance.post("/onboarding/complete_mother_tutorial")
    return response.data
  },

  // Updated Subscription management
  getSubscriptionStatus: async () => {
    const response = await axiosInstance.get("/payments/subscription_status")
    return response.data
  },

  activateSubscription: async (plan: "basic" | "standard" | "premium") => {
    if (plan === "basic") {
      const response = await axiosInstance.post("/payments/activate-free-plan")
      return response.data
    }
  
    const response = await axiosInstance.post("/payments/paypal-payment-success", { plan })
    return response.data
  },

  paypalVerify: async (data: { order_id: string; plan: string }) => {
    const response = await axiosInstance.post("/payments/paypal-verify", data)
    return response.data
  },
  
  
  // Booking management
  getBookingUsage: async () => {
    const response = await axiosInstance.get("/payments/booking-usage")  
    return response.data
  },

  incrementBooking: async () => {
    const response = await axiosInstance.post("/payments/booking-increment")
    return response.data
  },

  // Provider search by service
  searchProviders: async (service: string) => {
    const response = await axiosInstance.get(`/onboarding/search_providers?service=${service}`)
    return response.data
  },

  getSpecialitiesByService: async () => {
    const response = await axiosInstance.get("/onboarding/service-specialities");
    return response.data;
  },

  // New endpoint for workspace selection
  getProviderWorkspaces: async () => {
    const response = await axiosInstance.get("/onboarding/provider/workspace-select")
    return response.data
  },
  
    // ✅ Add this here:
  setAuthToken,
}

export default api
