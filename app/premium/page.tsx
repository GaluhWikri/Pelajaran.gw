"use client"

import { Check, Sparkles, Crown, Zap } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const features = [
  {
    category: "AI Features",
    icon: Sparkles,
    items: [
      "Unlimited AI chat messages",
      "Advanced AI note generation",
      "Smart flashcard creation",
      "Automated quiz generation",
      "AI study recommendations",
    ],
  },
  {
    category: "Storage & Organization",
    icon: Zap,
    items: [
      "Unlimited notes and materials",
      "Advanced search and filters",
      "Custom folders and tags",
      "Cloud backup and sync",
      "Export to multiple formats",
    ],
  },
  {
    category: "Learning Tools",
    icon: Crown,
    items: [
      "Advanced Pomodoro timer",
      "Study analytics dashboard",
      "Spaced repetition system",
      "Custom quiz difficulty",
      "Progress tracking",
    ],
  },
]

const plans = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    features: [
      "10 notes per month",
      "Basic AI features",
      "Standard flashcards",
      "Simple quizzes",
      "Basic Pomodoro timer",
    ],
    current: true,
  },
  {
    name: "Premium",
    price: 9.99,
    period: "month",
    features: [
      "Unlimited notes",
      "Advanced AI features",
      "Smart flashcards",
      "Automated quizzes",
      "Advanced study tools",
      "Priority support",
      "Cloud backup",
      "Export features",
    ],
    recommended: true,
  },
  {
    name: "Lifetime",
    price: 99,
    period: "one-time",
    features: ["All Premium features", "Lifetime access", "Early feature access", "Exclusive content", "VIP support"],
  },
]

export default function PremiumPage() {
  const { sidebarOpen } = useStore()

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Sidebar />

      <main className={cn("pt-14 transition-all duration-300", sidebarOpen ? "lg:pl-64" : "lg:pl-[70px]")}>
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                <Crown className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-balance">Upgrade to Premium</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock the full potential of AI-powered learning with unlimited access to all features
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.recommended ? "border-2 border-primary shadow-lg scale-105" : "border-border"}
              >
                <CardHeader>
                  {plan.recommended && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium w-fit mb-2">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </div>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                    {plan.current ? "Current Plan" : "Upgrade Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Everything You Need to Excel</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.category}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">Start Your Free Trial Today</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Try Premium free for 14 days. No credit card required. Cancel anytime.
              </p>
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
