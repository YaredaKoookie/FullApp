import { AppWindowIcon, HeartPlusIcon, CurrencyIcon ,NewspaperIcon, HistoryIcon, MessageCircleIcon, UserIcon, Calendar1Icon } from "lucide-react"

const doctorLinks = [
    {
        id: 1, 
        name: "Overview",
        url: "/doctor/dashboard",
        icon: AppWindowIcon       
    },
    {
        id: 2,
        name: "Appointments",
        url: "/doctor/appointments",
        icon: NewspaperIcon 
    },
    {
        id: 3,
        name: "Doctors",
        url: "/doctor/doctors",
        icon: HeartPlusIcon
    },
    {
        id: 8,
        name: "Profile",
        url: "/doctor/profile",
        icon: UserIcon
    },
    {
        id: 4,
        name: "Chat and Messages",
        url: "/doctor/chats",
        icon: MessageCircleIcon
    },
    {
        id: 5,
        name: "Medical Records",
        url: "/doctor/records",
        icon: HistoryIcon
    },
    {
        id: 6,
        name: "Payments",
        url: "/doctor/payments",
        icon: CurrencyIcon
    },
    {
        id:7,
        name : "Scheduling",
        url : "/doctor/schedule",
        icon : Calendar1Icon
    }
]

export default doctorLinks;