"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ColorSwatchProps {
    name: string
    variable: string
    text?: string
    border?: boolean
}

export function ColorSwatch({ name, variable, text, border = false }: ColorSwatchProps) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [colorInfo, setColorInfo] = React.useState<{ hex: string; rgb: string } | null>(null)
    const [isOpen, setIsOpen] = React.useState(false)

    const getColorInfo = () => {
        if (ref.current) {
            const computedStyle = window.getComputedStyle(ref.current)
            const bgColor = computedStyle.backgroundColor
            // bgColor is usually "rgb(r, g, b)" or "rgba(r, g, b, a)"

            const rgbValues = bgColor.match(/\d+/g)?.map(Number)
            if (rgbValues && rgbValues.length >= 3) {
                const [r, g, b] = rgbValues
                const hex = "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
                setColorInfo({ hex, rgb: bgColor })
            }
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`Copied ${text} to clipboard`)
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (open) getColorInfo()
        }}>
            <PopoverTrigger asChild>
                <div
                    ref={ref}
                    className={`p-4 rounded-lg flex flex-col justify-between h-32 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${variable} ${text} ${border ? 'border border-border/20' : ''} shadow-sm`}
                >
                    <span className="font-medium">{name}</span>
                    <span className="text-xs opacity-80 font-mono">{variable.replace("bg-", "")}</span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{name}</h4>
                        <p className="text-sm text-muted-foreground">
                            {variable}
                        </p>
                    </div>
                    {colorInfo && (
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium">Hex</span>
                                <button
                                    onClick={() => copyToClipboard(colorInfo.hex)}
                                    className="col-span-2 text-sm font-mono bg-muted p-1 px-2 rounded hover:bg-muted/80 flex items-center justify-between group"
                                >
                                    {colorInfo.hex}
                                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium">RGB</span>
                                <button
                                    onClick={() => copyToClipboard(colorInfo.rgb)}
                                    className="col-span-2 text-sm font-mono bg-muted p-1 px-2 rounded hover:bg-muted/80 flex items-center justify-between group"
                                >
                                    <span className="truncate">{colorInfo.rgb}</span>
                                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
