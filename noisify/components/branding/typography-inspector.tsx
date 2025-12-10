"use client"

import * as React from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TypographyInspectorProps {
    children: React.ReactNode
    name: string
    usage?: string
}

export function TypographyInspector({ children, name, usage }: TypographyInspectorProps) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [styleInfo, setStyleInfo] = React.useState<Record<string, string> | null>(null)

    const getStyleInfo = () => {
        // Find the first actual element inside the wrapper
        const element = ref.current?.firstElementChild as HTMLElement
        if (element) {
            const computed = window.getComputedStyle(element)
            setStyleInfo({
                "Font Family": computed.fontFamily.split(',')[0].replace(/"/g, ''),
                "Size": `${computed.fontSize} (${computed.fontSize})`,
                "Weight": computed.fontWeight,
                "Line Height": computed.lineHeight,
                "Letter Spacing": computed.letterSpacing,
            })
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    return (
        <Popover onOpenChange={(open) => {
            if (open) setTimeout(getStyleInfo, 0)
        }}>
            <PopoverTrigger asChild>
                <div ref={ref} className="cursor-pointer hover:bg-muted/20 rounded-md p-2 -m-2 transition-colors group relative border border-transparent hover:border-dashed hover:border-muted-foreground/30">
                    {children}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-xs bg-foreground text-background px-2 py-1 rounded transition-opacity">
                        Inspect
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{name}</h4>
                        {usage && <p className="text-sm text-muted-foreground">{usage}</p>}
                    </div>
                    {styleInfo && (
                        <div className="grid gap-2">
                            {Object.entries(styleInfo).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 items-center gap-4">
                                    <span className="text-sm font-medium">{key}</span>
                                    <div className="col-span-2 text-sm font-mono bg-muted p-1 px-2 rounded flex items-center justify-between">
                                        <span className="truncate">{value}</span>
                                        <button onClick={() => copyToClipboard(value)} className="hover:text-primary">
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
