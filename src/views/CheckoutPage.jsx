'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Gamepad2, ShieldCheck, Lock, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase/client'
import AnimatedLucideIcon from '@/components/AnimatedLucideIcon'
import LoadingSpinner from '@/components/LoadingSpinner'
import './CartPage.css'
import './CheckoutPage.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

const stripeAppearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#fbbf24',
    colorBackground: '#0f1729',
    colorText: '#f1f5f9',
    colorDanger: '#ef4444',
    colorTextSecondary: '#94a3b8',
    colorTextPlaceholder: '#64748b',
    fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
    fontSizeBase: '15px',
    borderRadius: '8px',
  },
}

// ── Inner payment form ─────────────────────────────────────────────────────
// Must live inside <Elements>. In deferred-intent mode, Elements renders
// immediately (no clientSecret needed). The PaymentIntent is created only
// when the user clicks "Pay Now", right before confirmPayment().
function PaymentForm({ amountInCents, currency, cartItems, convertAmount, orderNote, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || busy) return
    setError('')
    setBusy(true)

    try {
      // Step 1 — validate the payment details entered by the user
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Please check your payment details.')
        setBusy(false)
        return
      }

      // Step 2 — create the PaymentIntent server-side now that we have valid details
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
            customer_name: sessionUser?.user_metadata?.name || sessionUser?.email?.split('@')[0],
            notes: orderNote,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok || !data.clientSecret) {
        setError(data.error || 'Could not create payment. Please try again.')
        setBusy(false)
        return
      }

      // Step 3 — confirm the payment with the freshly-created clientSecret
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?payment_return=true`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed. Please try again.')
        setBusy(false)
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
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
    <form onSubmit={handleSubmit} className="payment-element-form">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="payment-error">
          <AlertCircle size={15} strokeWidth={2} />
          {error}
        </div>
      )}

      <button type="submit" className="pay-now-btn" disabled={!stripe || !elements || busy}>
        {busy
          ? <><Loader2 size={18} className="spin-icon" /> Processing…</>
          : <><Lock size={16} strokeWidth={2} /> Pay Now</>
        }
      </button>

      <div className="payment-trust-row">
        <ShieldCheck size={14} strokeWidth={2} />
        <span>Secured by Stripe — your card details never reach our servers.</span>
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

  const [paymentState, setPaymentState] = useState('idle') // idle | polling | success | error
  const [paymentIntentId, setPaymentIntentId] = useState(null)

  // Calculate totals
  const totalUsd = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalConverted = cartItems.reduce((s, i) => s + convertAmount(i.price) * i.quantity, 0)
  const amountInCents = Math.round(totalConverted * 100)
  const finalCurrency = currency.toLowerCase()

  // Handle 3DS redirect return
  useEffect(() => {
    if (!searchParams.get('payment_return')) return
    const piId = searchParams.get('payment_intent')
    const status = searchParams.get('redirect_status')
    if (status === 'succeeded' && piId) {
      setPaymentIntentId(piId)
      setPaymentState('polling')
    } else if (status === 'failed') {
      setPaymentState('error')
    }
  }, [searchParams])

  // Poll for order creation after payment succeeds
  const pollForOrder = useCallback(async (piId) => {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-order-by-payment-intent?payment_intent_id=${piId}`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        const body = await res.json()
        if (body?.order?.id) { setPaymentState('success'); return }
      } catch { /* keep polling */ }
    }
    setPaymentState('success') // show success anyway — webhook will create order
  }, [])

  useEffect(() => {
    if (paymentState === 'polling' && paymentIntentId) {
      pollForOrder(paymentIntentId)
    }
  }, [paymentState, paymentIntentId, pollForOrder])

  const handlePaymentSuccess = (piId) => {
    setPaymentIntentId(piId)
    setPaymentState('polling')
  }

  useEffect(() => { document.title = 'Checkout | zeuservices' }, [])
  useEffect(() => { if (!authLoading && !user) router.push('/login') }, [user, authLoading, router])

  if (authLoading) {
    return (
      <section className="section services" id="checkout">
        <div className="order-summary-container">
          <LoadingSpinner message="Verifying authentication…" />
        </div>
      </section>
    )
  }
  if (!user) return null

  // ── Success ──────────────────────────────────────────────────────────────
  if (paymentState === 'success') {
    return (
      <section className="section services" id="checkout">
        <div className="order-summary-container">
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
        </div>
      </section>
    )
  }

  // ── Polling ──────────────────────────────────────────────────────────────
  if (paymentState === 'polling') {
    return (
      <section className="section services" id="checkout">
        <div className="order-summary-container">
          <div className="checkout-polling">
            <Loader2 size={48} className="spin-icon" color="#fbbf24" strokeWidth={1.5} />
            <h2>Confirming your order…</h2>
            <p>Payment received. Setting up your order — this takes a few seconds.</p>
          </div>
        </div>
      </section>
    )
  }

  // ── Empty cart ───────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <section className="section services" id="checkout">
        <p className="eyebrow">Checkout</p>
        <h2 className="section-title">Your cart is empty</h2>
        <p className="section-subtitle">Add items to your cart to proceed to checkout.</p>
        <div className="empty-checkout">
          <button onClick={() => router.push('/boosting')} className="primary-btn">Continue Shopping</button>
        </div>
      </section>
    )
  }

  return (
    <section className="section services" id="checkout">
      <p className="eyebrow">Checkout</p>
      <h2 className="section-title">Complete your purchase</h2>
      <p className="section-subtitle">Review your order and pay securely.</p>

      <div className="checkout-container">
        {/* ── Order summary ─────────────────────────────────────────────── */}
        <div className="checkout-order-summary">
          <h3>Order Summary</h3>
          <div className="checkout-items">
            {cartItems.map((item) => (
              <div key={item.cartId} className="checkout-item">
                <div className="checkout-item-info">
                  <div className="checkout-item-icon">
                    {item.icon && typeof item.icon === 'string' && (item.icon.startsWith('/') || item.icon.startsWith('http'))
                      ? <img src={item.icon} alt={item.name} onError={(e) => { e.target.style.display = 'none' }} />
                      : <span><AnimatedLucideIcon icon={Gamepad2} size={20} /></span>
                    }
                  </div>
                  <div>
                    <h4>{item.name}</h4>
                    {item.customSelections && Object.keys(item.customSelections).length > 0
                      ? Object.entries(item.customSelections).filter(([, v]) => Boolean(v)).map(([field, value]) => (
                          <p key={`${item.cartId}-${field}`} className={field.toLowerCase() === 'version' ? 'version' : 'platform'}>
                            {field}: {value}
                          </p>
                        ))
                      : <>
                          {item.platform && <p className="platform">{item.platform.includes(':') ? item.platform : `Platform: ${item.platform}`}</p>}
                          {item.version && item.version !== 'Standard' && <p className="version">Version: {item.version}</p>}
                        </>
                    }
                  </div>
                </div>
                <div className="checkout-item-details">
                  <span className="checkout-item-qty">x{item.quantity}</span>
                  <span className="checkout-item-price">{formatPrice ? formatPrice(item.price) : `$${item.price}`}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span className="total-label">Total:</span>
            <span className="total-amount">{formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}</span>
          </div>

          <button onClick={() => router.push('/cart')} className="secondary-btn edit-cart-btn">Edit Cart</button>

          {/* Order notes */}
          <div className="order-note" style={{ marginTop: '1.5rem' }}>
            <div className="order-note-header">
              <h3>Order Notes (Optional)</h3>
              <p>Share account email, login details, or specific instructions. Encrypted and handled securely.</p>
            </div>
            <textarea
              name="order_note"
              value={orderNote}
              onChange={(e) => handleOrderNoteChange?.(e.target.value)}
              placeholder="e.g. Account email is user@example.com, password is ******, please add cars to Slot 1."
              maxLength={1000}
            />
            <div className="order-note-hint">Up to 1000 characters. Encrypted.</div>
          </div>

          {/* Dev skip */}
          {isAdmin && (
            <div className="dev-payment-section">
              <label className="payment-option dev-option">
                <input
                  type="checkbox"
                  checked={paymentMethod === 'dev_skip'}
                  onChange={(e) => setPaymentMethod(e.target.checked ? 'dev_skip' : 'stripe')}
                />
                <span className="option-title">Dev: skip payment</span>
              </label>
              {paymentMethod === 'dev_skip' && (
                <button className="checkout-btn" onClick={() => devCheckout(user)} disabled={checkoutStatus?.state === 'loading'}>
                  {checkoutStatus?.state === 'loading' ? 'Placing order…' : 'Place dev order'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Payment form ──────────────────────────────────────────────── */}
        {paymentMethod !== 'dev_skip' && (
          <div className="checkout-payment-form">
            <div className="payment-form-header">
              <CreditCard size={20} strokeWidth={2} color="#fbbf24" />
              <h3>Secure Payment</h3>
            </div>

            {!emailVerified && (
              <div className="checkout-verify-notice">
                <AlertCircle size={16} strokeWidth={2} />
                <span>Please verify your email before checking out.</span>
              </div>
            )}

            {/* Deferred-intent mode: Elements renders immediately without a
                clientSecret. The PI is only created when the user clicks Pay. */}
            {amountInCents >= 50 && emailVerified && (
              <Elements
                stripe={stripePromise}
                options={{
                  mode: 'payment',
                  amount: amountInCents,
                  currency: finalCurrency,
                  appearance: stripeAppearance,
                  loader: 'auto',
                }}
              >
                <PaymentForm
                  amountInCents={amountInCents}
                  currency={currency}
                  cartItems={cartItems}
                  convertAmount={convertAmount}
                  orderNote={orderNote}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            )}

            {amountInCents < 50 && (
              <div className="payment-error">
                <AlertCircle size={15} strokeWidth={2} />
                Order total is too small to process.
              </div>
            )}

            <div className="payment-badges">
              <div className="payment-badge"><ShieldCheck size={14} strokeWidth={2} /><span>256-bit SSL</span></div>
              <div className="payment-badge"><Lock size={14} strokeWidth={2} /><span>PCI Compliant</span></div>
              <div className="payment-badge"><CreditCard size={14} strokeWidth={2} /><span>Visa / Mastercard / Amex</span></div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
