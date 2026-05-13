'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  Gamepad2, ShieldCheck, Lock, CreditCard, CheckCircle,
  AlertCircle, Loader2, ChevronLeft, ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase/client'
import AnimatedLucideIcon from '@/components/AnimatedLucideIcon'
import LoadingSpinner from '@/components/LoadingSpinner'
import './CheckoutPage.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f1f5f9',
      fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
      fontSize: '15px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#64748b' },
      iconColor: '#fbbf24',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
  hidePostalCode: false,
}

// ── Card payment form ──────────────────────────────────────────────────────
function CardPaymentForm({ amountInCents, currency, cartItems, convertAmount, orderNote, onSuccess, formatPrice, totalUsd }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [nameOnCard, setNameOnCard] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || busy) return
    setError('')
    setBusy(true)

    try {
      const cardElement = elements.getElement(CardElement)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const sessionUser = sessionData?.session?.user

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items: cartItems.map(({ id, name, platform, version, customSelections, quantity, price }) => ({
              id, name, platform, version,
              customSelections: customSelections && typeof customSelections === 'object' ? customSelections : undefined,
              quantity,
              price_usd: price,
              price_converted: convertAmount(price),
              currency,
            })),
            total_amount: amountInCents / 100,
            currency,
            customer_email: sessionUser?.email,
            customer_name: nameOnCard.trim() || sessionUser?.user_metadata?.name || sessionUser?.email?.split('@')[0],
            notes: orderNote,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok || !data.clientSecret) {
        setError(data.error || 'Could not start payment. Please try again.')
        setBusy(false)
        return
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: sessionUser?.email || undefined,
              name: nameOnCard.trim() || sessionUser?.user_metadata?.name || sessionUser?.email?.split('@')[0] || undefined,
            },
          },
        }
      )

      if (confirmError) {
        setError(confirmError.message || 'Payment failed. Please check your card details.')
        setBusy(false)
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      } else if (paymentIntent?.status === 'requires_action') {
        setError('Additional verification required. Please try again or use a different card.')
        setBusy(false)
      } else {
        setError('Unexpected payment state. Please check your Orders page.')
        setBusy(false)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="co-card-form">
      {/* Payment method pill */}
      <div className="co-method-selected">
        <div className="co-method-radio" />
        <CreditCard size={16} strokeWidth={2} color="#fbbf24" />
        <span>Credit / Debit Card</span>
        <div className="co-card-logos">
          <span className="co-card-logo co-visa">VISA</span>
          <span className="co-card-logo co-mc">MC</span>
          <span className="co-card-logo co-amex">AMEX</span>
        </div>
      </div>

      <div className="co-card-fields">
        <div className="co-field-group">
          <label className="co-field-label">Name on card</label>
          <input
            className="co-field-input"
            type="text"
            placeholder="Full name as on card"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            autoComplete="cc-name"
            spellCheck={false}
          />
        </div>

        <div className="co-field-group">
          <label className="co-field-label">Card number</label>
          <div className={`co-card-stripe-wrapper ${cardReady ? 'ready' : ''}`}>
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onReady={() => setCardReady(true)}
              onChange={(e) => { if (e.error) setError(e.error.message); else setError('') }}
            />
          </div>
        </div>

        {error && (
          <div className="co-payment-error">
            <AlertCircle size={15} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="co-pay-btn"
          disabled={!stripe || !elements || busy || !cardReady}
        >
          {busy
            ? <><Loader2 size={18} className="co-spin" /> Processing…</>
            : <><Lock size={16} strokeWidth={2} /> Pay {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`} now</>
          }
        </button>

        <p className="co-stripe-note">
          <ShieldCheck size={13} strokeWidth={2} />
          Secured by Stripe — your card details never reach our servers
        </p>
      </div>
    </form>
  )
}

// ── Main checkout page ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, emailVerified, isAdmin } = useAuth()
  const {
    cartItems, formatPrice, convertAmount, currency,
    orderNote, handleOrderNoteChange,
    paymentMethod, setPaymentMethod,
    handleCheckout: devCheckout, checkoutStatus,
  } = useCart()

  const [paymentState, setPaymentState] = useState('idle')
  const [paymentIntentId, setPaymentIntentId] = useState(null)

  const totalUsd = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalConverted = cartItems.reduce((s, i) => s + convertAmount(i.price) * i.quantity, 0)
  const amountInCents = Math.round(totalConverted * 100)

  useEffect(() => {
    if (!searchParams.get('payment_return')) return
    const piId = searchParams.get('payment_intent')
    const status = searchParams.get('redirect_status')
    if (status === 'succeeded' && piId) { setPaymentIntentId(piId); setPaymentState('polling') }
    else if (status === 'failed') setPaymentState('error')
  }, [searchParams])

  const pollForOrder = useCallback(async (piId) => {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-order-by-payment-intent?payment_intent_id=${piId}`,
          { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` } }
        )
        const body = await res.json()
        if (body?.order?.id) { setPaymentState('success'); return }
      } catch { /* keep polling */ }
    }
    setPaymentState('success')
  }, [])

  useEffect(() => {
    if (paymentState === 'polling' && paymentIntentId) pollForOrder(paymentIntentId)
  }, [paymentState, paymentIntentId, pollForOrder])

  const handlePaymentSuccess = (piId) => { setPaymentIntentId(piId); setPaymentState('polling') }

  useEffect(() => { document.title = 'Checkout | zeuservices' }, [])
  useEffect(() => { if (!authLoading && !user) router.push('/login') }, [user, authLoading, router])

  if (authLoading) {
    return (
      <section className="section services co-page-wrap" id="checkout">
        <LoadingSpinner message="Verifying authentication…" />
      </section>
    )
  }
  if (!user) return null

  if (paymentState === 'success') {
    return (
      <section className="section services co-page-wrap" id="checkout">
        <div className="checkout-success">
          <div className="checkout-success-icon"><CheckCircle size={64} strokeWidth={1.3} color="#10b981" /></div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your order. We'll get started right away.</p>
          <div className="checkout-success-actions">
            <button className="primary-btn" onClick={() => router.push('/orders')}>View My Orders</button>
            <a href="https://discord.gg/zeusservices" className="secondary-btn discord-btn" target="_blank" rel="noreferrer">
              Open Discord to Continue
            </a>
          </div>
          <p className="checkout-success-note">
            Join our Discord and open a ticket — your order details will be shared with the team automatically.
          </p>
        </div>
      </section>
    )
  }

  if (paymentState === 'polling') {
    return (
      <section className="section services co-page-wrap" id="checkout">
        <div className="checkout-polling">
          <Loader2 size={48} className="co-spin" color="#fbbf24" strokeWidth={1.5} />
          <h2>Confirming your order…</h2>
          <p>Payment received. Setting up your order — this takes a few seconds.</p>
        </div>
      </section>
    )
  }

  if (cartItems.length === 0) {
    return (
      <section className="section services" id="checkout">
        <p className="eyebrow">Checkout</p>
        <h2 className="section-title">Your cart is empty</h2>
        <p className="section-subtitle">Add items to your cart to proceed to checkout.</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button onClick={() => router.push('/boosting')} className="primary-btn">Continue Shopping</button>
        </div>
      </section>
    )
  }

  return (
    <section className="section services co-page-wrap" id="checkout">
      {/* ── Page header ── */}
      <div className="co-page-header">
        <button className="co-back-btn" onClick={() => router.push('/cart')}>
          <ChevronLeft size={18} strokeWidth={2} />
          <span>Back</span>
        </button>
        <div className="co-page-title">
          <Lock size={15} strokeWidth={2} color="#fbbf24" />
          <span>Secure checkout</span>
        </div>
        <div />
      </div>

      {/* ── Two-column body ── */}
      <div className="co-body">

        {/* LEFT — form */}
        <div className="co-left">

          {/* Items */}
          <div className="co-block">
            {cartItems.map((item) => (
              <div key={item.cartId} className="co-item-row">
                <div className="co-item-icon">
                  {item.icon && typeof item.icon === 'string' && (item.icon.startsWith('/') || item.icon.startsWith('http'))
                    ? <img src={item.icon} alt={item.name} onError={(e) => { e.target.style.display = 'none' }} />
                    : <AnimatedLucideIcon icon={Gamepad2} size={20} />
                  }
                </div>
                <div className="co-item-info">
                  <span className="co-item-name">{item.name}</span>
                  <span className="co-item-meta">
                    {[
                      item.customSelections && Object.keys(item.customSelections).length > 0
                        ? Object.entries(item.customSelections).filter(([, v]) => Boolean(v)).map(([k, v]) => `${k}: ${v}`).join(' · ')
                        : [item.platform, item.version && item.version !== 'Standard' && `Version: ${item.version}`].filter(Boolean).join(' · '),
                      `Qty: ${item.quantity}`,
                    ].filter(Boolean).join(' | ')}
                  </span>
                </div>
                <span className="co-item-price">
                  {formatPrice ? formatPrice(item.price * item.quantity) : `$${item.price * item.quantity}`}
                </span>
              </div>
            ))}
          </div>

          <div className="co-divider" />

          {/* Order notes */}
          <div className="co-block">
            <label className="co-section-label">
              Order Notes <span className="co-optional">(optional)</span>
            </label>
            <p className="co-section-sub">Share account details or specific instructions. Encrypted and handled securely.</p>
            <textarea
              className="co-textarea"
              value={orderNote}
              onChange={(e) => handleOrderNoteChange?.(e.target.value)}
              placeholder="e.g. Account email is user@example.com, password is ******, please add cars to Slot 1."
              maxLength={1000}
              rows={3}
            />
            <p className="co-field-hint">Up to 1000 characters. Encrypted.</p>
          </div>

          <div className="co-divider" />

          {/* Payment method */}
          <div className="co-block">
            <label className="co-section-label">Payment method</label>

            {isAdmin && (
              <div className="co-dev-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={paymentMethod === 'dev_skip'}
                    onChange={(e) => setPaymentMethod(e.target.checked ? 'dev_skip' : 'stripe')}
                  />
                  <span>Dev: skip payment</span>
                </label>
                {paymentMethod === 'dev_skip' && (
                  <button className="co-pay-btn" onClick={() => devCheckout(user)} disabled={checkoutStatus?.state === 'loading'}>
                    {checkoutStatus?.state === 'loading' ? 'Placing order…' : 'Place dev order'}
                  </button>
                )}
              </div>
            )}

            {paymentMethod !== 'dev_skip' && (
              !emailVerified ? (
                <div className="co-verify-notice">
                  <AlertCircle size={15} strokeWidth={2} />
                  <span>Please verify your email before checking out.</span>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <CardPaymentForm
                    amountInCents={amountInCents}
                    currency={currency}
                    cartItems={cartItems}
                    convertAmount={convertAmount}
                    orderNote={orderNote}
                    onSuccess={handlePaymentSuccess}
                    formatPrice={formatPrice}
                    totalUsd={totalUsd}
                  />
                </Elements>
              )
            )}
          </div>

          {/* Security logos */}
          <div className="co-sec-logos">
            <div className="co-sec-item"><ShieldCheck size={13} /><span>256-bit SSL</span></div>
            <div className="co-sec-item"><Lock size={13} /><span>PCI Compliant</span></div>
            <div className="co-sec-item"><CreditCard size={13} /><span>Visa / MC / Amex</span></div>
          </div>
        </div>

        {/* RIGHT — order summary */}
        <div className="co-right">
          <h3 className="co-summary-heading">Order Summary</h3>

          <div className="co-summary-rows">
            {cartItems.map((item) => (
              <div key={item.cartId} className="co-summary-row">
                <span className="co-summary-row-label">
                  {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                </span>
                <span className="co-summary-row-val">
                  {formatPrice ? formatPrice(item.price * item.quantity) : `$${item.price * item.quantity}`}
                </span>
              </div>
            ))}
          </div>

          <div className="co-summary-divider" />

          <div className="co-summary-total">
            <span>Total</span>
            <span className="co-summary-total-amount">
              {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}
            </span>
          </div>

          <div className="co-trust-block">
            <ShieldCheck size={20} strokeWidth={2} color="#10b981" />
            <div>
              <p className="co-trust-title">Safe &amp; Secure Payment</p>
              <p className="co-trust-sub">100% protected by Stripe</p>
            </div>
          </div>

          <button className="co-edit-cart-btn" onClick={() => router.push('/cart')}>
            Edit cart
          </button>
        </div>

      </div>
    </section>
  )
}
