import { AppWindowIcon, HeartPlusIcon, CurrencyIcon ,NewspaperIcon, HistoryIcon, MessageCircleIcon, UserIcon, Shield } from "lucide-react"

const patientLinks = [
    {
        id: 1, 
        name: "Overview",
        url: "/patient/dashboard",
        icon: AppWindowIcon       
    },
    {
        id: 2,
        name: "Appointments",
        url: "/patient/appointments",
        icon: NewspaperIcon 
    },
    {
        id: 3,
        name: "Doctors",
        url: "/patient/doctors",
        icon: HeartPlusIcon
    },
    {
        id: 8,
        name: "Profile",
        url: "/patient/profile",
        icon: UserIcon
    },
    {
        id: 4,
        name: "Security and Privacy",
        url: "/patient/security",
        icon: Shield
    },
    {
        id: 5,
        name: "Medical Histories",
        url: "/patient/medical-history",
        icon: HistoryIcon
    },
    {
        id: 6,
        name: "Payments",
        url: "/patient/payments",
        icon: CurrencyIcon
    },
]

export default patientLinks;