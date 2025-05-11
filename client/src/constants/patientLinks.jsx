import { AppWindowIcon, HeartPlusIcon, CurrencyIcon ,NewspaperIcon, HistoryIcon, MessageCircleIcon, UserIcon } from "lucide-react"

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
        name: "Chat and Messages",
        url: "/patient/chats",
        icon: MessageCircleIcon
    },
    {
        id: 5,
        name: "Medical Records",
        url: "/patient/records",
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