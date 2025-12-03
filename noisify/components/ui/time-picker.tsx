"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
    value?: string
    onChange: (value: string) => void
    className?: string
    minTime?: string
}

export function TimePicker({
    value,
    onChange,
    className,
    minTime
}: TimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

    const [selectedHour, setSelectedHour] = React.useState(value?.split(':')[0] || '12')
    const [selectedMinute, setSelectedMinute] = React.useState(value?.split(':')[1] || '00')

    React.useEffect(() => {
        if (value) {
            const [h, m] = value.split(':')
            setSelectedHour(h)
            setSelectedMinute(m)
        }
    }, [value])

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        if (type === 'hour') {
            setSelectedHour(val)
            const newTime = `${val}:${selectedMinute}`
            onChange(newTime)
        } else {
            setSelectedMinute(val)
            const newTime = `${selectedHour}:${val}`
            onChange(newTime)
        }
    }

    // Scroll to selected time on open
    const hourRef = React.useRef<HTMLDivElement>(null)
    const minuteRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (hourRef.current) {
                    const selectedHourEl = hourRef.current.querySelector(`[data-value="${selectedHour}"]`) as HTMLElement
                    if (selectedHourEl) {
                        hourRef.current.scrollTop = selectedHourEl.offsetTop - hourRef.current.offsetTop
                    }
                }
                if (minuteRef.current) {
                    const selectedMinuteEl = minuteRef.current.querySelector(`[data-value="${selectedMinute}"]`) as HTMLElement
                    if (selectedMinuteEl) {
                        minuteRef.current.scrollTop = selectedMinuteEl.offsetTop - minuteRef.current.offsetTop
                    }
                }
            }, 0)
        }
    }, [isOpen, selectedHour, selectedMinute])

    const isHourDisabled = (hour: string) => {
        if (!minTime) return false
        const minHour = minTime.split(':')[0]
        return parseInt(hour) < parseInt(minHour)
    }

    const isMinuteDisabled = (minute: string) => {
        if (!minTime) return false
        const [minHour, minMinute] = minTime.split(':')
        if (selectedHour !== minHour) return false
        return parseInt(minute) < parseInt(minMinute)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value || <span>Välj tid</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-[300px] divide-x">
                    <div ref={hourRef} className="flex flex-col p-2 overflow-y-auto w-[80px] scrollbar-hide">
                        <div className="text-xs font-medium text-center text-muted-foreground mb-2">Timmar</div>
                        {hours.map((hour) => (
                            <Button
                                key={hour}
                                data-value={hour}
                                variant={selectedHour === hour ? "default" : "ghost"}
                                className="h-8 w-full justify-center shrink-0 mb-1"
                                onClick={() => handleTimeChange('hour', hour)}
                                disabled={isHourDisabled(hour)}
                            >
                                {hour}
                            </Button>
                        ))}
                    </div>
                    <div ref={minuteRef} className="flex flex-col p-2 overflow-y-auto w-[80px] scrollbar-hide">
                        <div className="text-xs font-medium text-center text-muted-foreground mb-2">Minuter</div>
                        {minutes.map((minute) => (
                            <Button
                                key={minute}
                                data-value={minute}
                                variant={selectedMinute === minute ? "default" : "ghost"}
                                className="h-8 w-full justify-center shrink-0 mb-1"
                                onClick={() => handleTimeChange('minute', minute)}
                                disabled={isMinuteDisabled(minute)}
                            >
                                {minute}
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
