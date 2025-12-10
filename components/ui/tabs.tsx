"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange } as any)
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const TabsList: React.FC<TabsListProps> = ({ value, onValueChange, children, className }) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
        className
      )}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange } as any)
        }
        return child
      })}
    </div>
  )
}

interface TabsTriggerProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
  triggerValue: string
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, onValueChange, children, className, triggerValue }) => {
  const isActive = value === triggerValue
  
  return (
    <button
      onClick={() => onValueChange?.(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-900",
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value?: string
  children: React.ReactNode
  className?: string
  contentValue: string
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className, contentValue }) => {
  if (value !== contentValue) {
    return null
  }
  
  return (
    <div
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
