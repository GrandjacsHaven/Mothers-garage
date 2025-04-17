"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import LanguageSwitcher from "@/components/language-switcher"
import { PageContainer } from "@/components/page-container"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 border-b">
        <PageContainer>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/motherslogo.png"
                alt="Mother&apos;s Garage Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <span className="font-bold text-xl text-[#832D90]">Mother&apos;s Garage</span>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link href="#" className="text-gray-600 hover:text-[#FF00E1]">
                About
              </Link>
              <Link href="#" className="text-gray-600 hover:text-[#FF00E1]">
                Services
              </Link>
              <Link href="#" className="text-gray-600 hover:text-[#FF00E1]">
                Contact
              </Link>
            </nav>
            <div className="flex gap-3 items-center">
              <LanguageSwitcher />
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="border-[#832D90] text-[#832D90] hover:bg-[#832D90] hover:text-white"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </header>

      <main className="flex-1">
        <section className="py-16 px-2 md:py-24">
          <PageContainer>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Welcome to <span className="text-[#FF00E1]">Mother&apos;s Garage</span>
                </h1>
                <p className="text-lg text-gray-700">
                  Your trusted platform for on-demand home care services, connecting mothers with qualified caregivers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/onboarding/user-type">
                    <Button className="bg-[#FF00E1] hover:bg-[#FF00E1]/90 text-white px-8 py-6 rounded-xl text-lg">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      className="border-[#832D90] text-[#832D90] hover:bg-[#832D90] hover:text-white px-8 py-6 rounded-xl text-lg"
                    >
                      Login
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/test4.jpg" alt="Mother and caregiver" fill className="object-cover" />
              </div>
            </div>
          </PageContainer>
        </section>

        <section className="bg-[#F8F8F8] py-16">
          <PageContainer>
            <div className="text-center space-y-12">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-md">
                  <div className="w-16 h-16 bg-[#FF00E1]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-[#FF00E1]">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                  <p className="text-gray-600">Create your account as a mother or service provider</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                  <div className="w-16 h-16 bg-[#832D90]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-[#832D90]">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect</h3>
                  <p className="text-gray-600">Find qualified caregivers or connect with mothers in need</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                  <div className="w-16 h-16 bg-[#C46B41]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-[#C46B41]">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Receive Care</h3>
                  <p className="text-gray-600">Get the support you need from trusted professionals</p>
                </div>
              </div>
            </div>
          </PageContainer>
        </section>
      </main>

      <footer className="bg-[#832D90] text-white py-8">
        <PageContainer>
          <div className="grid md:grid-cols-4 px-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Mother&apos;s Garage</h3>
              <p className="text-white/80">Your trusted platform for on-demand home care services.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    Teletherapy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    Home Care
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white">
                    Nutrition
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact Us</h4>
              <p className="text-white/80">Email: info@mothersgarage.com</p>
              <p className="text-white/80">Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-6 text-center text-white/60">
            <p>© {new Date().getFullYear()} Mothers Garage. All rights reserved.</p>
          </div>
        </PageContainer>
      </footer>
    </div>
  )
}
