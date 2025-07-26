import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-96 mt-2 animate-pulse"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Filters Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-16 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>

      {/* Table Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-80 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
            </div>
            
            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}