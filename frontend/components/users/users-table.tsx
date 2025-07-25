import React from "react"
import { UserCompanyWithDetails } from "@/lib/types/company"

interface UsersTableProps {
  members: UserCompanyWithDetails[]
}

export const UsersTable: React.FC<UsersTableProps> = ({ members }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-slate-200 rounded-md">
        <thead>
          <tr className="bg-slate-100">
            <th className="px-4 py-2 text-left">Nome</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Ruolo</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t border-slate-200">
              <td className="px-4 py-2">{member.user_full_name || "-"}</td>
              <td className="px-4 py-2">{member.user_email || "-"}</td>
              <td className="px-4 py-2 capitalize">{member.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 