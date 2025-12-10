
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ColorSwatch } from "@/components/branding/color-swatch"
import { TypographyInspector } from "@/components/branding/typography-inspector"

export default function BrandingPage() {
    return (
        <div className="container mx-auto py-10 space-y-16">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Branding & Design System</h1>
                <p className="text-lg text-muted-foreground">
                    A collection of design tokens, colors, typography, and components used across the application.
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Colors</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <ColorSwatch name="Background" variable="bg-background" text="text-foreground" border />
                    <ColorSwatch name="Foreground" variable="bg-foreground" text="text-background" />
                    <ColorSwatch name="Card" variable="bg-card" text="text-card-foreground" border />
                    <ColorSwatch name="Card Foreground" variable="bg-card-foreground" text="text-card" />
                    <ColorSwatch name="Popover" variable="bg-popover" text="text-popover-foreground" border />
                    <ColorSwatch name="Popover Foreground" variable="bg-popover-foreground" text="text-popover" />
                    <ColorSwatch name="Primary" variable="bg-primary" text="text-primary-foreground" />
                    <ColorSwatch name="Primary Foreground" variable="bg-primary-foreground" text="text-primary" border />
                    <ColorSwatch name="Secondary" variable="bg-secondary" text="text-secondary-foreground" />
                    <ColorSwatch name="Secondary Foreground" variable="bg-secondary-foreground" text="text-secondary" border />
                    <ColorSwatch name="Muted" variable="bg-muted" text="text-muted-foreground" />
                    <ColorSwatch name="Muted Foreground" variable="bg-muted-foreground" text="text-muted" />
                    <ColorSwatch name="Accent" variable="bg-accent" text="text-accent-foreground" />
                    <ColorSwatch name="Accent Foreground" variable="bg-accent-foreground" text="text-accent" border />
                    <ColorSwatch name="Destructive" variable="bg-destructive" text="text-destructive-foreground" />
                    <ColorSwatch name="Destructive Foreground" variable="bg-destructive-foreground" text="text-destructive" border />
                    <ColorSwatch name="Border" variable="bg-border" text="text-foreground" border />
                    <ColorSwatch name="Input" variable="bg-input" text="text-foreground" border />
                    <ColorSwatch name="Ring" variable="bg-ring" text="text-background" />
                </div>

                <h3 className="text-xl font-medium mt-8 mb-4">Chart Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ColorSwatch name="Chart 1" variable="bg-chart-1" text="text-white" />
                    <ColorSwatch name="Chart 2" variable="bg-chart-2" text="text-white" />
                    <ColorSwatch name="Chart 3" variable="bg-chart-3" text="text-white" />
                    <ColorSwatch name="Chart 4" variable="bg-chart-4" text="text-white" />
                    <ColorSwatch name="Chart 5" variable="bg-chart-5" text="text-white" />
                </div>

                <h3 className="text-xl font-medium mt-8 mb-4">Marketing / Brand Colors</h3>
                <p className="text-sm text-muted-foreground mb-4">These colors define the application's visual identity on public pages.</p>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Primary Brand (Indigo & Violet)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <ColorSwatch name="Indigo 50" variable="bg-indigo-50" text="text-indigo-900" border />
                            <ColorSwatch name="Indigo 100" variable="bg-indigo-100" text="text-indigo-900" />
                            <ColorSwatch name="Indigo 500" variable="bg-indigo-500" text="text-white" />
                            <ColorSwatch name="Indigo 600" variable="bg-indigo-600" text="text-white" />
                            <ColorSwatch name="Indigo 700" variable="bg-indigo-700" text="text-white" />
                            <ColorSwatch name="Violet 600" variable="bg-violet-600" text="text-white" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Neutrals (Slate)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <ColorSwatch name="Slate 50" variable="bg-slate-50" text="text-slate-900" border />
                            <ColorSwatch name="Slate 100" variable="bg-slate-100" text="text-slate-900" />
                            <ColorSwatch name="Slate 200" variable="bg-slate-200" text="text-slate-900" />
                            <ColorSwatch name="Slate 500" variable="bg-slate-500" text="text-white" />
                            <ColorSwatch name="Slate 700" variable="bg-slate-700" text="text-white" />
                            <ColorSwatch name="Slate 900" variable="bg-slate-900" text="text-white" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Accents (Landing Page)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <ColorSwatch name="Purple 200" variable="bg-purple-200" text="text-purple-900" />
                            <ColorSwatch name="Pink 200" variable="bg-pink-200" text="text-pink-900" />
                            <ColorSwatch name="Rose 50" variable="bg-rose-50" text="text-rose-900" border />
                            <ColorSwatch name="Amber 50" variable="bg-amber-50" text="text-amber-900" border />
                            <ColorSwatch name="Blue 50" variable="bg-blue-50" text="text-blue-900" border />
                            <ColorSwatch name="Cyan 50" variable="bg-cyan-50" text="text-cyan-900" border />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Typography</h2>
                <div className="space-y-8">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 1</p>
                        <TypographyInspector name="Heading 1" usage="Page titles">
                            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                                The quick brown fox jumps over the lazy dog
                            </h1>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 2</p>
                        <TypographyInspector name="Heading 2" usage="Section titles">
                            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                                The quick brown fox jumps over the lazy dog
                            </h2>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 3</p>
                        <TypographyInspector name="Heading 3" usage="Subsection titles">
                            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                                The quick brown fox jumps over the lazy dog
                            </h3>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 4</p>
                        <TypographyInspector name="Heading 4" usage="Small titles">
                            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                                The quick brown fox jumps over the lazy dog
                            </h4>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Paragraph (P)</p>
                        <TypographyInspector name="Paragraph" usage="Body text">
                            <p className="leading-7 [&:not(:first-child)]:mt-6">
                                The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.
                            </p>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Blockquote</p>
                        <TypographyInspector name="Blockquote" usage="Quotes">
                            <blockquote className="mt-6 border-l-2 pl-6 italic">
                                "The quick brown fox jumps over the lazy dog."
                            </blockquote>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Lead</p>
                        <TypographyInspector name="Lead" usage="Introduction text">
                            <p className="text-xl text-muted-foreground">
                                The quick brown fox jumps over the lazy dog.
                            </p>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Large</p>
                        <TypographyInspector name="Large" usage="Emphasized body text">
                            <div className="text-lg font-semibold">The quick brown fox jumps over the lazy dog.</div>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Small</p>
                        <TypographyInspector name="Small" usage="Legal text, captions">
                            <small className="text-sm font-medium leading-none">The quick brown fox jumps over the lazy dog.</small>
                        </TypographyInspector>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Muted</p>
                        <TypographyInspector name="Muted" usage="Secondary text">
                            <p className="text-sm text-muted-foreground">The quick brown fox jumps over the lazy dog.</p>
                        </TypographyInspector>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Components</h2>

                <div className="grid gap-10">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Buttons</h3>
                        <div className="flex flex-wrap gap-4">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="link">Link</Button>
                            <Button size="sm">Small</Button>
                            <Button size="lg">Large</Button>
                            <Button size="icon">
                                <span className="h-4 w-4">★</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Badges</h3>
                        <div className="flex flex-wrap gap-4">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                            <Badge variant="outline">Outline</Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Cards</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Card Title</CardTitle>
                                    <CardDescription>Card Description goes here.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p>Card Content area. This is where the main content of the card lives.</p>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-sm text-muted-foreground">Card Footer</p>
                                </CardFooter>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create project</CardTitle>
                                    <CardDescription>Deploy your new project in one-click.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form>
                                        <div className="grid w-full items-center gap-4">
                                            <div className="flex flex-col space-y-1.5">
                                                <Label htmlFor="name">Name</Label>
                                                <Input id="name" placeholder="Name of your project" />
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline">Cancel</Button>
                                    <Button>Deploy</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Inputs & Forms</h3>
                        <div className="grid max-w-sm gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input type="email" id="email" placeholder="Email" />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="disabled-input">Disabled Input</Label>
                                <Input disabled type="email" id="disabled-input" placeholder="Disabled" />
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="message">Message</Label>
                                <Textarea placeholder="Type your message here." id="message" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="airplane-mode" />
                                <Label htmlFor="airplane-mode">Airplane Mode</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Avatars & Skeletons</h3>
                        <div className="flex items-center gap-8">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    )
}


