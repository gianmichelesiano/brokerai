import React from "react"
import { getCompanyMembers } from "@/lib/api/company"
import { UsersTable } from "@/components/users/users-table"

export default async function UsersPage() {

  let companyName = ""
  try {
    const data = await getCompanyMembers()

    companyName = data.company_name
  } catch (e) {
    // fallback: errore o non autenticato
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Utenti azienda {companyName}</h1>

    </div>
  )
} 