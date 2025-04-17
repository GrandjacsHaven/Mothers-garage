// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useToast } from "@/hooks/use-toast"
// import { api } from "@/lib/api"
// import { useTranslation } from "react-i18next"
// import { Loader2 } from 'lucide-react'
// import { isValidEmail } from "@/lib/utils"

// interface AuthFormProps {
//   type: "login" | "register" | "forgot-password" | "reset-password"
//   defaultTab?: "mother" | "provider"
//   redirectUrl?: string
// }

// export function AuthForm({ type, defaultTab = "mother", redirectUrl }: AuthFormProps) {
//   const router = useRouter()
//   const { toast } = useToast()
//   const { t } = useTranslation()
//   const [isLoading, setIsLoading] = useState(false)
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     confirmPassword: "",
//     resetToken: "",
//   })

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { id, value } = e.target
//     setFormData((prev) => ({ ...prev, [id]: value }))
//   }

//   const validateForm = () => {
//     if (!isValidEmail(formData.email)) {
//       toast({
//         title: t("auth.invalidEmail"),
//         description: t("auth.pleaseEnterValidEmail"),
//         variant: "destructive",
//       })
//       return false
//     }

//     if (type === "register" || type === "reset-password") {
//       if (formData.password !== formData.confirmPassword) {
//         toast({
//           title: t("auth.passwordMismatch"),
//           description: t("auth.passwordsDoNotMatch"),
//           variant: "destructive",
//         })
//         return false
//       }
//     }

//     return true
//   }

//   const handleSubmit = async (e: React.FormEvent, userType: "mother" | "provider") => {
//     e.preventDefault()
    
//     if (!validateForm()) return
    
//     setIsLoading(true)

//     try {
//       if (type === "login") {
//         const response = await api.login(formData.email, formData.password)
        
//         // Store token in localStorage
//         localStorage.setItem("auth_token", response.token)
        
//         toast({
//           title: t("auth.loginSuccessful"),
//           description: t("auth.youAreNowLoggedIn"),
//         })
        
//         // Redirect based on user type or specified redirect URL
//         if (redirectUrl) {
//           router.push(redirectUrl)
//         } else if (response.user_type === "mother") {
//           router.push("/mother/dashboard")
//         } else {
//           router.push("/provider/dashboard")
//         }
//       } else if (type === "forgot-password") {
//         await api.requestPasswordReset(formData.email)
        
//         toast({
//           title: t("auth.resetLinkSent"),
//           description: t("auth.checkEmailForResetLink"),
//         })
        
//         // Redirect to login page after a short delay
//         setTimeout(() => {
//           router.push("/auth/login")
//         }, 3000)
//       } else if (type === "reset-password") {
//         await api.resetPassword(formData.resetToken, formData.password)
        
//         toast({
//           title: t("auth.passwordReset"),
//           description: t("auth.passwordResetSuccessful"),
//         })
        
//         // Redirect to login page after a short delay
//         setTimeout(() => {
//           router.push("/auth/login")
//         }, 3000)
//       }
//     } catch (error) {
//       console.error("Auth error:", error)
      
//       toast({
//         title: type === "login" 
//           ? t("auth.loginFailed") 
//           : type === "forgot-password"
//             ? t("auth.resetRequestFailed")
//             : t("auth.passwordResetFailed"),
//         description: t("auth.pleaseTryAgain"),
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <Card className="w-full max-w-md shadow-lg">
//       <CardHeader className="text-center">
//         <CardTitle className="text-2xl">
//           {type === "login" 
//             ? t("auth.welcomeBack") 
//             : type === "forgot-password"
//               ? t("auth.forgotPassword")
//               : type === "reset-password"
//                 ? t("auth.resetPassword")
//                 : t("auth.createAccount")}
//         </CardTitle>
//         <CardDescription>
//           {type === "login" 
//             ? t("auth.loginSubtitle") 
//             : type === "forgot-password"
//               ? t("auth.forgotPasswordSubtitle")
//               : type === "reset-password"
//                 ? t("auth.resetPasswordSubtitle")
//                 : t("auth.registerSubtitle")}
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         {(type === "login" || type === "register") && (
//           <Tabs defaultValue={defaultTab} className="w-full">
//             <TabsList className="grid w-full grid-cols-2 mb-6">
//               <TabsTrigger 
//                 value="mother" 
//                 className="data-[state=active]:bg-[#FF00E1] data-[state=active]:text-white"
//               >
//                 {t("userType.mother")}
//               </TabsTrigger>
//               <TabsTrigger 
//                 value="provider" 
//                 className="data-[state=active]:bg-[#832D90] data-[state=active]:text-white"
//               >
//                 {t("userType.provider")}
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="mother">
//               <form onSubmit={(e) => handleSubmit(e, "mother")} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="email">{t("auth.email")}</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder={t("auth.enterEmail")}
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
                
//                 {(type === "login" || type === "register") && (
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <Label htmlFor="password">{t("auth.password")}</Label>
//                       {type === "login" && (
//                         <Link href="/auth/forgot-password" className="text-xs text-[#FF00E1] hover:underline">
//                           {t("auth.forgotPassword")}?
//                         </Link>
//                       )}
//                     </div>
//                     <Input
//                       id="password"
//                       type="password"
//                       placeholder={t("auth.enterPassword")}
//                       value={formData.password}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 )}
                
//                 {(type === "register" || type === "reset-password") && (
//                   <div className="space-y-2">
//                     <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
//                     <Input
//                       id="confirmPassword"
//                       type="password"
//                       placeholder={t("auth.confirmYourPassword")}
//                       value={formData.confirmPassword}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 )}
                
//                   {type === "reset-password" && (
//                   <div className="space-y-2">
//                     <Label htmlFor="resetToken">{t("auth.resetToken")}</Label>
//                     <Input
//                       id="resetToken"
//                       placeholder={t("auth.enterResetToken")}
//                       value={formData.resetToken}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 )}
                
//                 <Button 
//                   type="submit" 
//                   className={`w-full ${
//                     defaultTab === "mother" ? "bg-[#FF00E1] hover:bg-[#FF00E1]/90" : "bg-[#832D90] hover:bg-[#832D90]/90"
//                   }`} 
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       {type === "login" 
//                         ? t("auth.loggingIn") 
//                         : type === "forgot-password"
//                           ? t("auth.requesting")
//                           : type === "reset-password"
//                             ? t("auth.resetting")
//                             : t("auth.registering")}
//                     </>
//                   ) : (
//                     type === "login" 
//                       ? t("auth.login") 
//                       : type === "forgot-password"
//                         ? t("auth.requestReset")
//                         : type === "reset-password"
//                           ? t("auth.resetPassword")
//                           : t("auth.register")
//                   )}
//                 </Button>
//               </form>
//             </TabsContent>

//             <TabsContent value="provider">
//               <form onSubmit={(e) => handleSubmit(e, "provider")} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="email">{t("auth.email")}</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder={t("auth.enterEmail")}
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
                
//                 {(type === "login" || type === "register") && (
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <Label htmlFor="password">{t("auth.password")}</Label>
//                       {type === "login" && (
//                         <Link href="/auth/forgot-password" className="text-xs text-[#832D90] hover:underline">
//                           {t("auth.forgotPassword")}?
//                         </Link>
//                       )}
//                     </div>
//                     <Input
//                       id="password"
//                       type="password"
//                       placeholder={t("auth.enterPassword")}
//                       value={formData.password}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 )}
                
//                 {(type === "register" || type === "reset-password") && (
//                   <div className="space-y-2">
//                     <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
//                     <Input
//                       id="confirmPassword"
//                       type="password"
//                       placeholder={t("auth.confirmYourPassword")}
//                       value={formData.confirmPassword}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 )}
                
//                 {type === "reset-password" && (
//                   <div className="space-y-2">
//                     <Label htmlFor="resetToken">{t("auth.resetToken")}</Label>
//                     <Input
//                       id="resetToken"
//                       placeholder={t("auth.enterResetToken")}
//                       value={formData.resetToken}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 )}
                
//                 <Button 
//                   type="submit" 
//                   className="w-full bg-[#832D90] hover:bg-[#832D90]/90" 
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       {type === "login" 
//                         ? t("auth.loggingIn") 
//                         : type === "forgot-password"
//                           ? t("auth.requesting")
//                           : type === "reset-password"
//                             ? t("auth.resetting")
//                             : t("auth.registering")}
//                     </>
//                   ) : (
//                     type === "login" 
//                       ? t("auth.login") 
//                       : type === "forgot-password"
//                         ? t("auth.requestReset")
//                         : type === "reset-password"
//                           ? t("auth.resetPassword")
//                           : t("auth.register")
//                   )}
//                 </Button>
//               </form>
//             </TabsContent>
//           </Tabs>
//         )}

//         {(type === "forgot-password" || type === "reset-password") && (
//           <form onSubmit={(e) => handleSubmit(e, "mother")} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">{t("auth.email")}</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder={t("auth.enterEmail")}
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
            
//             {type === "reset-password" && (
//               <>
//                 <div className="space-y-2">
//                   <Label htmlFor="resetToken">{t("auth.resetToken")}</Label>
//                   <Input
//                     id="resetToken"
//                     placeholder={t("auth.enterResetToken")}
//                     value={formData.resetToken}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="password">{t("auth.newPassword")}</Label>
//                   <Input
//                     id="password"
//                     type="password"
//                     placeholder={t("auth.enterNewPassword")}
//                     value={formData.password}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="confirmPassword">{t("auth.confirmNewPassword")}</Label>
//                   <Input
//                     id="confirmPassword"
//                     type="password"
//                     placeholder={t("auth.confirmYourNewPassword")}
//                     value={formData.confirmPassword}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//               </>
//             )}
            
//             <Button 
//               type="submit" 
//               className="w-full bg-[#FF00E1] hover:bg-[#FF00E1]/90" 
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   {type === "forgot-password" ? t("auth.requesting") : t("auth.resetting")}
//                 </>
//               ) : (
//                 type === "forgot-password" ? t("auth.requestReset") : t("auth.resetPassword")
//               )}
//             </Button>
//           </form>
//         )}
//       </CardContent>
//       <CardFooter className="flex flex-col space-y-4">
//         <div className="text-center text-sm">
//           {type === "login" ? (
//             <>
//               {t("auth.noAccount")}{" "}
//               <Link href="/onboarding/user-type" className="text-[#FF00E1] hover:underline">
//                 {t("auth.signUp")}
//               </Link>
//             </>
//           ) : type === "register" ? (
//             <>
//               {t("auth.alreadyHaveAccount")}{" "}
//               <Link href="/auth/login" className="text-[#FF00E1] hover:underline">
//                 {t("auth.login")}
//               </Link>
//             </>
//           ) : (
//             <>
//               <Link href="/auth/login" className="text-[#FF00E1] hover:underline">
//                 {t("auth.backToLogin")}
//               </Link>
//             </>
//           )}
//         </div>
//       </CardFooter>
//     </Card>
//   )
// }