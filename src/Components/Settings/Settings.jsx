import { useContext } from "react"
import { MainUserContext } from "../../Context/AuthContext"

export function SettingsPage() {
    const {mainUser, updateMainUser} = useContext(MainUserContext)
    return (
        "Settings"
    )
}