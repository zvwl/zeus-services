'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Gamepad2, ShieldCheck, Lock, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase/client'
import AnimatedLucideIcon from '@/components/AnimatedLucideIcon'
import LoadingSpinner from '@/components/LoadingSpinner'
import './CartPage.css'
import './CheckoutPage.css'

// stripePromise with NO options — CardElement doesn't need clientSecret in
// the Elements wrapper so Stripe.js never calls /v1/elements/sessions.
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
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
}

// ── Card payment form ──────────────────────────────────────────────────────
function CardPaymentForm({ amountInCents, currency, cartItems, convertAmount, orderNote, user, onSuccess }) {
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

      // Step 1 — create PaymentIntent server-side
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
        setError(data.error || 'Could not start payment. Please try again.')
        setBusy(false)
        return
      }

      // Step 2 — confirm card payment directly (no /v1/elements/sessions call)
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
        // 3DS handled automatically by confirmCardPayment — if we reach here it failed
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
    <form onSubmit={handleSubmit} className="payment-element-form">
      <div className="card-field-group">
        <div className="card-element-label">Name on card</div>
        <input
          className="card-name-input"
          type="text"
          placeholder="Full name as on card"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          autoComplete="cc-name"
          spellCheck={false}
        />
      </div>

      <div className="card-section-divider" />

      <div className="card-field-group">
        <div className="card-element-label">Card details</div>
        <div className={`card-element-wrapper ${cardReady ? 'ready' : ''}`}>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onReady={() => setCardReady(true)}
            onChange={(e) => { if (e.error) setError(e.error.message); else setError('') }}
          />
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <AlertCircle size={15} strokeWidth={2} />
          {error}
        </div>
      )}

      <button type="submit" className="pay-now-btn" disabled={!stripe || !elements || busy || !cardReady}>
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

  const [paymentState, setPaymentState] = useState('idle')
  const [paymentIntentId, setPaymentIntentId] = useState(null)

  const totalUsd = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalConverted = cartItems.reduce((s, i) => s + convertAmount(i.price) * i.quantity, 0)
  const amountInCents = Math.round(totalConverted * 100)

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

  const handlePaymentSuccess = (piId) => {
    setPaymentIntentId(piId)
    setPaymentState('polling')
  }

  useEffect(() => { document.title = 'Checkout | zeuservices' }, [])
  useEffect(() => { if (!authLoading && !user) router.push('/login') }, [user, authLoading, router])

  if (authLoading) {
    return (
      <section className="section services" id="checkout">
        <div className="order-summary-container"><LoadingSpinner message="Verifying authentication…" /></div>
      </section>
    )
  }
  if (!user) return null

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
        {/* Order summary */}
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

        {/* Payment form */}
        {paymentMethod !== 'dev_skip' && (
          <div className="checkout-payment-form">
            <div className="payment-form-header">
              <CreditCard size={20} strokeWidth={2} color="#fbbf24" />
              <h3>Secure Payment</h3>
            </div>

            {!emailVerified ? (
              <div className="checkout-verify-notice">
                <AlertCircle size={16} strokeWidth={2} />
                <span>Please verify your email before checking out.</span>
              </div>
            ) : (
              /* Elements with NO options — CardElement doesn't call
                 /v1/elements/sessions so the account-level 400 is bypassed */
              <Elements stripe={stripePromise}>
                <CardPaymentForm
                  amountInCents={amountInCents}
                  currency={currency}
                  cartItems={cartItems}
                  convertAmount={convertAmount}
                  orderNote={orderNote}
                  user={user}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
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
