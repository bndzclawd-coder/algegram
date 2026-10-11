import Stripe from 'stripe'

// Server-only. Never import this file from a 'use client' component; import plans from lib/plans.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export { PLANS } from './plans'
