import { useContext } from "react"
import { MainUserContext } from "../../Context/AuthContext"

export function AccountsPage() {
    const {mainUser, updateMainUser} = useContext(MainUserContext)
    return (
        "Acccounts"
    )
}