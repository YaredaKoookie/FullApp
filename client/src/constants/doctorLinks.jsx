import { AppWindowIcon, HeartPlusIcon, CurrencyIcon ,NewspaperIcon, HistoryIcon, MessageCircleIcon, UserIcon, Calendar1Icon, User2Icon, Settings2Icon } from "lucide-react"

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
        name: "Patients",
        url: "/doctor/patient",
        icon: User2Icon
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
    },
    {
        id: 9,
        name : "Setting",
        url : "/doctor/setting",
        icon : Settings2Icon
    }
]

export default doctorLinks;