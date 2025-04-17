import Link from "next/link"
import { useTranslation } from "react-i18next"
import { Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#832D90] text-white py-8 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Mother&apos;s Garage</h3>
            <p className="text-white/80">{t("footer.tagline")}</p>
            <div className="flex mt-4 space-x-4">
              <a href="#" className="text-white hover:text-white/80" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-white/80" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-white/80" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/80 hover:text-white">
                  {t("navigation.home")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-white">
                  {t("navigation.about")}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-white/80 hover:text-white">
                  {t("navigation.services")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/80 hover:text-white">
                  {t("navigation.contact")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("footer.services")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services/teletherapy" className="text-white/80 hover:text-white">
                  {t("services.teletherapy")}
                </Link>
              </li>
              <li>
                <Link href="/services/home-care" className="text-white/80 hover:text-white">
                  {t("services.homeCare")}
                </Link>
              </li>
              <li>
                <Link href="/services/nutrition" className="text-white/80 hover:text-white">
                  {t("services.nutrition")}
                </Link>
              </li>
              <li>
                <Link href="/services/mental-health" className="text-white/80 hover:text-white">
                  {t("services.mentalHealth")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("footer.contactUs")}</h4>
            <div className="space-y-2">
              <p className="flex items-center text-white/80">
                <Mail className="mr-2 h-4 w-4" />
                info@mothersgarage.com
              </p>
              <p className="flex items-center text-white/80">
                <Phone className="mr-2 h-4 w-4" />
                +1 (555) 123-4567
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-white/60">
          <p>{t("footer.rights", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}