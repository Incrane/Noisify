import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { sv } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
    date?: Date
    setDate: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    fromDate?: Date
    fromYear?: number
    toYear?: number
}

export function DatePicker({
    date,
    setDate,
    placeholder = "YYYY-MM-DD",
    className,
    disabled = false,
    fromDate,
    fromYear,
    toYear
}: DatePickerProps) {
    const [inputValue, setInputValue] = React.useState("")

    React.useEffect(() => {
        if (date) {
            setInputValue(format(date, "yyyy-MM-dd"))
        } else {
            setInputValue("")
        }
    }, [date])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)

        if (value === "") {
            setDate(undefined)
            return
        }

        const parsedDate = parse(value, "yyyy-MM-dd", new Date())
        if (isValid(parsedDate)) {
            setDate(parsedDate)
        }
    }

    const handleCalendarSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate)
        // ensure input is updated if valid date selected (effect will handle it usually, but direct update is safer for UI feel)
    }

    return (
        <div className={cn("relative", className)}>
            <Popover>
                <div className="relative w-full">
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn("pr-10", className && "w-full")} // Ensure input takes full width if needed
                    />
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent hover:text-foreground"
                            disabled={disabled}
                            tabIndex={-1} // Skip tab index as input is primary
                        >
                            <CalendarIcon className="h-4 w-4" />
                            <span className="sr-only">Öppna kalender</span>
                        </Button>
                    </PopoverTrigger>
                </div>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleCalendarSelect}
                        initialFocus
                        locale={sv}
                        fromDate={fromDate}
                        captionLayout="dropdown-buttons"
                        fromYear={fromYear ?? 1900}
                        toYear={toYear ?? new Date().getFullYear() + 10}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
