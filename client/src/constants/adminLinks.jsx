import { AppWindowIcon, HeartPlusIcon, CurrencyIcon ,NewspaperIcon, HistoryIcon, MessageCircleIcon, UserIcon, UserX2Icon } from "lucide-react"

const adminLinks = [
    {
        id: 1, 
        name: "Overview",
        url: "/admin/overView",
        icon: AppWindowIcon       
    },
    {
        id: 2,
        name: "Patients",
        url: "/admin/patients",
        icon: UserX2Icon 
    },
    {
        id: 3,
        name: "Doctors",
        url: "/admin/doctors",
        icon: HeartPlusIcon
    },
    {
        id: 8,
        name: "Profile",
        url: "/admin/profile",
        icon: UserIcon
    },
    {
        id: 6,
        name: "Payments",
        url: "/admin/payments",
        icon: CurrencyIcon
    },
]

export default adminLinks;