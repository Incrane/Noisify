'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StepAccount from './StepAccount'
import StepProfile from './StepProfile'
import StepOrganization from './StepOrganization'

type WizardStep = 'account' | 'profile' | 'organization'

interface WizardData {
    // Account data
    email?: string
    password?: string
    firstName?: string
    lastName?: string
    phone?: string

    // Profile data (might be same as account, or additional fields)

    // Organization data
    orgName?: string
    orgAddress?: string
    contactEmail?: string
    contactPhone?: string
}

export default function OrganizationWizard() {
    const [currentStep, setCurrentStep] = useState<WizardStep>('account')
    const [wizardData, setWizardData] = useState<WizardData>({})

    const handleAccountComplete = (data: Partial<WizardData>) => {
        setWizardData(prev => ({ ...prev, ...data }))
        setCurrentStep('profile')
    }

    const handleProfileComplete = (data: Partial<WizardData>) => {
        setWizardData(prev => ({ ...prev, ...data }))
        setCurrentStep('organization')
    }

    const handleOrganizationComplete = () => {
        // This will redirect after successful creation
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    }

    const stepDirection = currentStep === 'account' ? -1 : currentStep === 'profile' ? 0 : 1

    return (
        <div className="flex min-h-screen">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <StepIndicator
                                label="Konto"
                                isActive={currentStep === 'account'}
                                isCompleted={currentStep !== 'account'}
                            />
                            <div className="flex-1 h-1 bg-slate-200 mx-2">
                                <motion.div
                                    className="h-full bg-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: currentStep === 'account' ? '0%' : currentStep === 'profile' ? '50%' : '100%'
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <StepIndicator
                                label="Användarprofil"
                                isActive={currentStep === 'profile'}
                                isCompleted={currentStep === 'organization'}
                            />
                            <div className="flex-1 h-1 bg-slate-200 mx-2">
                                <motion.div
                                    className="h-full bg-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: currentStep === 'organization' ? '100%' : '0%'
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <StepIndicator
                                label="Verksamhet"
                                isActive={currentStep === 'organization'}
                                isCompleted={false}
                            />
                        </div>
                    </div>

                    {/* Step Content */}
                    <AnimatePresence mode="wait" custom={stepDirection}>
                        {currentStep === 'account' && (
                            <motion.div
                                key="account"
                                custom={stepDirection}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <StepAccount onComplete={handleAccountComplete} />
                            </motion.div>
                        )}

                        {currentStep === 'profile' && (
                            <motion.div
                                key="profile"
                                custom={stepDirection}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <StepProfile
                                    onComplete={handleProfileComplete}
                                    initialData={wizardData}
                                    onBack={() => setCurrentStep('account')}
                                />
                            </motion.div>
                        )}

                        {currentStep === 'organization' && (
                            <motion.div
                                key="organization"
                                custom={stepDirection}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <StepOrganization
                                    onComplete={handleOrganizationComplete}
                                    onBack={() => setCurrentStep('profile')}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Side - Testimonial */}
            <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5"></div>
                <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-lg"
                    >
                        {/* Avatar */}
                        <div className="mb-8">
                            <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-3xl font-bold mb-6">
                                MB
                            </div>
                        </div>

                        {/* Quote */}
                        <blockquote className="text-2xl font-light leading-relaxed mb-8">
                            "Påminnelser och köhantering i Noisify gör att fler dyker upp — och vi slipper papperslistor helt. Vi behöver inte ens prata om GDPR som är grundat i Noisify."
                        </blockquote>

                        {/* Attribution */}
                        <div>
                            <div className="font-bold text-xl mb-1">Maja Bergeström</div>
                            <div className="text-white/80">Enhetschef</div>
                            <div className="text-white/60 text-sm">Uddevalla kommun</div>
                        </div>
                    </motion.div>

                    {/* Decorative Elements */}
                    <motion.div
                        className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-20 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

function StepIndicator({ label, isActive, isCompleted }: { label: string; isActive: boolean; isCompleted: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300' :
                        isCompleted ? 'bg-green-500 text-white' :
                            'bg-slate-200 text-slate-400'
                    }`}
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {isCompleted ? '✓' : ''}
            </motion.div>
            <div className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {label}
            </div>
        </div>
    )
}
