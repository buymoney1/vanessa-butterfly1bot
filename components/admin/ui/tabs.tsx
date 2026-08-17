'use client'

import * as React from "react"

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

export function Tabs({ value, onValueChange, children, className = '' }: TabsContextType & { children: React.ReactNode; className?: string }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1 ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  
  const isActive = context.value === value
  
  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  
  if (context.value !== value) return null
  
  return <div className={className}>{children}</div>
}