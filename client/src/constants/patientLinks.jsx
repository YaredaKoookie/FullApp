import { AppWindowIcon, HeartPlusIcon, CurrencyIcon ,NewspaperIcon, HistoryIcon, MessageCircleIcon, UserIcon, Shield } from "lucide-react"

const patientLinks = [
    {
        id: 1, 
        name: "Overview",
        url: "overview",
        icon: AppWindowIcon       
    },
    {
        id: 2,
        name: "Appointments",
        url: "appointments",
        icon: NewspaperIcon 
    },
    {
        id: 3,
        name: "Doctors",
        url: "doctors",
        icon: HeartPlusIcon
    },
    {
        id: 8,
        name: "Profile",
        url: "profile",
        icon: UserIcon
    },
    {
        id: 4,
        name: "Security and Privacy",
        url: "security",
        icon: Shield
    },
    {
        id: 5,
        name: "Medical Histories",
        url: "medical-history",
        icon: HistoryIcon
    },
    {
        id: 6,
        name: "Payments",
        url: "payments",
        icon: CurrencyIcon
    },
]

export default patientLinks;