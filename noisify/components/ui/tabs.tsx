"use client"

import * as React from "react"

const TabsContext = React.createContext<{
    activeTab: string
    setActiveTab: (value: string) => void
} | null>(null)

export function Tabs({ defaultValue, value, onValueChange, children, className }: { defaultValue?: string, value?: string, onValueChange?: (value: string) => void, children: React.ReactNode, className?: string }) {
    const [internalActiveTab, setInternalActiveTab] = React.useState(defaultValue || "")

    const isControlled = value !== undefined
    const activeTab = isControlled ? value : internalActiveTab
    const setActiveTab = React.useCallback((newValue: string) => {
        if (!isControlled) {
            setInternalActiveTab(newValue)
        }
        onValueChange?.(newValue)
    }, [isControlled, onValueChange])

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={`flex space-x-1 rounded-xl bg-slate-100 p-1 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className, disabled }: { value: string, children: React.ReactNode, className?: string, disabled?: boolean }) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")

    const isActive = context.activeTab === value
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && context.setActiveTab(value)}
            className={`
        flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all
        ${isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}
        ${disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-500" : ""}
        ${className}
      `}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")

    if (context.activeTab !== value) return null
    return <div className={`mt-6 animate-in fade-in-50 duration-300 ${className}`}>{children}</div>
}
