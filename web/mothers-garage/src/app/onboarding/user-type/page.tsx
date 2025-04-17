"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@/lib/api"

export default function UserTypeSelection() {
  const { t } = useTranslation()

  // Record user type selection
  const handleUserTypeSelection = async (userType: "mother" | "provider") => {
    try {
      await api.selectUserType(userType)
  
      // Save user type to localStorage
      localStorage.setItem("user_type", userType)
    } catch (error) {
      console.error("Error selecting user type:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <header className="px-6 py-4 bg-white border-b">
        <div className="container mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-[#FF00E1]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-centerenter justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">{t("userType.title")}</h1>
            <p className="text-gray-600">{t("userType.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-transparent hover:border-[#FF00E1] transition-all shadow-lg overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-[#FF00E1]">{t("userType.mother")}</CardTitle>
                <CardDescription>{t("userType.motherDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                  <Image src="/mothers.png" alt="Mother" fill className="object-cover" />
                </div>
                <ul className="space-y-2 text-sm">
                {Array.isArray(t("userType.motherFeatures", { returnObjects: true }))
                ? (t("userType.motherFeatures", { returnObjects: true }) as string[]).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-5 h-5 rounded-full bg-[#FF00E1]/10 text-[#FF00E1] flex items-center justify-center mr-2 text-xs">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))
                : null}
                </ul>
              </CardContent>
              <CardFooter>
                <Link
                  href="/onboarding/mother/signup"
                  className="w-full"
                  onClick={() => handleUserTypeSelection("mother")}
                >
                  <Button className="w-full bg-[#FF00E1] hover:bg-[#FF00E1]/90 text-white py-6 rounded-xl">
                    {t("userType.continueMother")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-2 border-transparent hover:border-[#832D90] transition-all shadow-lg overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-[#832D90]">{t("userType.provider")}</CardTitle>
                <CardDescription>{t("userType.providerDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                  <Image src="/test4.jpg" alt="Service Provider" fill className="object-cover" />
                </div>
                <ul className="space-y-2 text-sm">
                {Array.isArray(t("userType.providerFeatures", { returnObjects: true }))
                  ? (t("userType.providerFeatures", { returnObjects: true }) as string[]).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-5 h-5 rounded-full bg-[#FF00E1]/10 text-[#FF00E1] flex items-center justify-center mr-2 text-xs">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))
                  : null}
                </ul>
              </CardContent>
              <CardFooter>
                <Link
                  href="/onboarding/provider/signup"
                  className="w-full"
                  onClick={() => handleUserTypeSelection("provider")}
                >
                  <Button className="w-full bg-[#832D90] hover:bg-[#832D90]/90 text-white py-6 rounded-xl">
                    {t("userType.continueProvider")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 bg-white border-t">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>{t("common.footer.rights", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  )
}
