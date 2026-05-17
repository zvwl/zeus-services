'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  Gamepad2, ShieldCheck, Lock, CreditCard, CheckCircle,
  AlertCircle, Loader2, ChevronLeft, Package,
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
      '::placeholder': { color: '#475569' },
      iconColor: '#fbbf24',
    },
    invalid: { color: '#f87171', iconColor: '#f87171' },
  },
  hidePostalCode: true, // we collect postcode ourselves so UK format works
}

// ── Card brand logos ───────────────────────────────────────────────────────
function VisaLogo() {
  return (
    <svg className="co-brand-svg" viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <rect width="60" height="38" rx="5" fill="#1a1f71"/>
      <text x="30" y="27" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="Arial Black,Arial,sans-serif" letterSpacing="1.5">VISA</text>
    </svg>
  )
}
function MastercardLogo() {
  return (
    <svg className="co-brand-svg" viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <rect width="60" height="38" rx="5" fill="#1a1a1a"/>
      <circle cx="22" cy="19" r="11" fill="#eb001b"/>
      <circle cx="38" cy="19" r="11" fill="#f79e1b"/>
      <path d="M30 10.2a11 11 0 0 1 0 17.6A11 11 0 0 1 30 10.2z" fill="#ff5f00"/>
    </svg>
  )
}
function AmexLogo() {
  return (
    <svg className="co-brand-svg" viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" aria-label="American Express">
      <rect width="60" height="38" rx="5" fill="#2557d6"/>
      <text x="30" y="20" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="0.4">AMERICAN</text>
      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="7.5" fontFamily="Arial,sans-serif" letterSpacing="1">EXPRESS</text>
    </svg>
  )
}

// ── Inner checkout — has access to Stripe hooks ────────────────────────────
function CheckoutInner({
  cartItems, formatPrice, convertAmount, currency,
  orderNote, handleOrderNoteChange,
  paymentMethod, setPaymentMethod,
  handleCheckout: devCheckout, checkoutStatus,
  totalUsd, totalConverted, amountInCents,
  emailVerified, isAdmin, user,
  onSuccess, onBack,
}) {
  const stripe = useStripe()
  const elements = useElements()

  const [nameOnCard, setNameOnCard] = useState('')
  const [postcode, setPostcode] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [cardBrand, setCardBrand] = useState('')

  const handleCardChange = (e) => {
    setCardBrand(e.brand || '')
    setCardComplete(e.complete)
    setFieldErrors(prev => ({ ...prev, card: e.error ? e.error.message : '' }))
    if (!e.error) setError('')
  }

  const validate = () => {
    const errs = {}
    if (!nameOnCard.trim()) errs.name = 'Name on card is required.'
    if (!cardComplete) errs.card = fieldErrors.card || 'Please complete your card details.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePay = async () => {
    if (!stripe || !elements || busy || !cardReady) return
    if (paymentMethod === 'dev_skip') {
      devCheckout(user)
      return
    }

    if (!validate()) return   // show field-level errors, don't submit

    setError('')
    setBusy(true)

    try {
      const cardElement = elements.getElement(CardElement)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const sessionUser = sessionData?.session?.user

      // 1 — Create PaymentIntent server-side
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)

      let res
      try {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
          {
            method: 'POST',
            signal: ctrl.signal,
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              items: cartItems.map(({ id, name, platform, version, customSelections, quantity, price }) => ({
                id,
                name,
                platform,
                version,
                customSelections: customSelections && typeof customSelections === 'object' ? customSelections : undefined,
                quantity,
                price_usd: price,
                price_converted: convertAmount(price),
                currency,
              })),
              total_amount: amountInCents / 100,
              currency,
              customer_email: sessionUser?.email,
              customer_name:
                nameOnCard.trim() ||
                sessionUser?.user_metadata?.name ||
                sessionUser?.email?.split('@')[0],
              notes: orderNote || null,
            }),
          }
        )
      } finally {
        clearTimeout(timer)
      }

      const data = await res.json()
      if (!res.ok || !data.clientSecret) {
        setError(data.error || 'Could not start payment. Please try again.')
        setBusy(false)
        return
      }

      // 2 — Confirm the card payment
      const billingName =
        nameOnCard.trim() ||
        sessionUser?.user_metadata?.name ||
        sessionUser?.email?.split('@')[0] ||
        undefined

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: billingName,
              email: sessionUser?.email || undefined,
              address: postcode.trim()
                ? { postal_code: postcode.trim().toUpperCase() }
                : undefined,
            },
          },
          receipt_email: sessionUser?.email || undefined,
        }
      )

      if (confirmError) {
        // Map common Stripe decline codes to friendly messages
        const declineMessages = {
          card_declined: 'Your card was declined. Please check your details or use a different card.',
          insufficient_funds: 'Insufficient funds. Please use a different card.',
          incorrect_cvc: 'Incorrect CVC. Please check your card details.',
          expired_card: 'Your card has expired. Please use a different card.',
          incorrect_number: 'Incorrect card number. Please check and try again.',
          processing_error: 'A processing error occurred. Please try again.',
        }
        const msg =
          declineMessages[confirmError.decline_code] ||
          declineMessages[confirmError.code] ||
          confirmError.message ||
          'Payment failed. Please check your card details.'
        setError(msg)
        setBusy(false)
      } else if (paymentIntent?.status === 'succeeded') {
        // Give Stripe's CardElement time to clean up before unmounting Elements
        setTimeout(() => onSuccess(paymentIntent.id), 50)
      } else if (paymentIntent?.status === 'requires_action') {
        // 3DS — confirmCardPayment handles it automatically; if we land here it failed
        setError('Additional authentication required. Please try again or use a different card.')
        setBusy(false)
      } else {
        setError(`Unexpected payment state (${paymentIntent?.status}). Check your Orders page.`)
        setBusy(false)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
      setBusy(false)
    }
  }

  const formattedTotal = formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`
  const canPay = stripe && elements && cardReady && !busy && emailVerified

  return (
    <div className="co-body">
      {/* ── LEFT: items + notes + card fields ── */}
      <div className="co-left">

        {/* Items */}
        <div className="co-block">
          <div className="co-block-heading">
            <Package size={15} strokeWidth={2} color="#fbbf24" />
            <span>Your order</span>
          </div>
          {cartItems.map((item) => {
            const metaParts = item.customSelections && Object.keys(item.customSelections).length > 0
              ? Object.entries(item.customSelections).filter(([, v]) => Boolean(v)).map(([k, v]) => `${k}: ${v}`)
              : [item.platform, item.version && item.version !== 'Standard' && `Version: ${item.version}`].filter(Boolean)

            return (
              <div key={item.cartId} className="co-item-row">
                <div className="co-item-icon">
                  {item.icon && typeof item.icon === 'string' && (item.icon.startsWith('/') || item.icon.startsWith('http'))
                    ? <img src={item.icon} alt={item.name} onError={(e) => { e.target.style.display = 'none' }} />
                    : <AnimatedLucideIcon icon={Gamepad2} size={18} />
                  }
                </div>
                <div className="co-item-info">
                  <span className="co-item-name">{item.name}</span>
                  {metaParts.length > 0 && (
                    <span className="co-item-meta">{metaParts.join(' · ')}{item.quantity > 1 ? ` · ×${item.quantity}` : ''}</span>
                  )}
                </div>
                <span className="co-item-price">
                  {formatPrice ? formatPrice(item.price * item.quantity) : `$${item.price * item.quantity}`}
                </span>
              </div>
            )
          })}
        </div>

        <div className="co-divider" />

        {/* Order notes */}
        <div className="co-block">
          <label className="co-block-heading" htmlFor="order-notes" style={{ cursor: 'default' }}>
            <ShieldCheck size={15} strokeWidth={2} color="#6ee7b7" />
            <span>Order notes <span className="co-optional">(optional)</span></span>
          </label>
          <textarea
            id="order-notes"
            name="orderNotes"
            className="co-textarea"
            value={orderNote}
            onChange={(e) => handleOrderNoteChange?.(e.target.value)}
            placeholder="e.g. Account email is user@example.com, please boost Slot 1."
            maxLength={1000}
            rows={3}
          />
          <p className="co-field-hint">
            Encrypted at rest · 1000 chars max · Do not include passwords unless necessary
          </p>
        </div>

        <div className="co-divider" />

        {/* Payment fields */}
        <div className="co-block">
          <div className="co-block-heading">
            <CreditCard size={15} strokeWidth={2} color="#fbbf24" />
            <span>Payment details</span>
          </div>

          {!emailVerified ? (
            <div className="co-verify-notice">
              <AlertCircle size={15} strokeWidth={2} />
              <span>Please verify your email address before checking out.</span>
            </div>
          ) : (
            <>
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
                </div>
              )}

              {paymentMethod !== 'dev_skip' && (
                <div className="co-card-fields">
                  {/* Payment method pill */}
                  <div className="co-method-pill">
                    <div className="co-method-dot" />
                    <span>Credit / Debit Card</span>
                    <div className="co-brand-logos">
                      <VisaLogo /><MastercardLogo /><AmexLogo />
                    </div>
                  </div>

                  {/* Name on card — required */}
                  <div className="co-field-group">
                    <label className="co-field-label" htmlFor="cc-name">
                      Name on card <span className="co-required">*</span>
                    </label>
                    <input
                      id="cc-name"
                      name="ccName"
                      className={`co-field-input${fieldErrors.name ? ' co-field-input--error' : ''}`}
                      type="text"
                      placeholder="Full name as it appears on your card"
                      value={nameOnCard}
                      onChange={(e) => {
                        setNameOnCard(e.target.value)
                        if (e.target.value.trim()) setFieldErrors(p => ({ ...p, name: '' }))
                      }}
                      autoComplete="cc-name"
                      spellCheck={false}
                      required
                    />
                    {fieldErrors.name && <p className="co-field-error">{fieldErrors.name}</p>}
                  </div>

                  {/* Card number + expiry + CVC — required */}
                  <div className="co-field-group">
                    <label className="co-field-label" htmlFor="card-element">
                      Card details <span className="co-required">*</span>
                      {cardBrand && cardBrand !== 'unknown' && (
                        <span className="co-detected-brand"> · {cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)} detected</span>
                      )}
                    </label>
                    <div className={`co-stripe-wrapper${cardReady ? ' ready' : ''}${fieldErrors.card ? ' co-stripe-wrapper--error' : ''}`}>
                      <CardElement
                        id="card-element"
                        options={CARD_ELEMENT_OPTIONS}
                        onReady={() => setCardReady(true)}
                        onChange={handleCardChange}
                      />
                    </div>
                    {fieldErrors.card && <p className="co-field-error">{fieldErrors.card}</p>}
                  </div>

                  {/* Postcode */}
                  <div className="co-field-group">
                    <label className="co-field-label" htmlFor="billing-postcode">Billing postcode <span className="co-optional">(optional — helps with fraud checks)</span></label>
                    <input
                      id="billing-postcode"
                      name="billingPostcode"
                      className="co-field-input co-field-input--sm"
                      type="text"
                      placeholder="e.g. SW1A 1AA"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      autoComplete="postal-code"
                      spellCheck={false}
                      maxLength={10}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Security row */}
        <div className="co-sec-logos">
          <div className="co-sec-item"><ShieldCheck size={12} /><span>256-bit SSL</span></div>
          <div className="co-sec-item"><Lock size={12} /><span>PCI DSS</span></div>
          <div className="co-sec-item"><CreditCard size={12} /><span>Visa · MC · Amex</span></div>
        </div>
      </div>

      {/* ── RIGHT: summary + pay ── */}
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
          <span className="co-summary-total-amount">{formattedTotal}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="co-error-box">
            <AlertCircle size={15} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Pay button */}
        {paymentMethod === 'dev_skip' ? (
          <button
            className="co-pay-btn"
            onClick={() => devCheckout(user)}
            disabled={checkoutStatus?.state === 'loading'}
          >
            {checkoutStatus?.state === 'loading'
              ? <><Loader2 size={18} className="co-spin" /> Placing…</>
              : 'Place dev order'
            }
          </button>
        ) : (
          <button
            className="co-pay-btn"
            onClick={handlePay}
            disabled={!canPay}
          >
            {busy
              ? <><Loader2 size={18} className="co-spin" /> Processing…</>
              : <><Lock size={16} strokeWidth={2.5} /> Pay {formattedTotal} now</>
            }
          </button>
        )}

        <p className="co-stripe-note">
          <ShieldCheck size={12} strokeWidth={2} />
          Secured by Stripe · your card never touches our servers
        </p>

        <div className="co-trust-block">
          <CheckCircle size={18} strokeWidth={2} color="#10b981" />
          <div>
            <p className="co-trust-title">Safe &amp; Secure Payment</p>
            <p className="co-trust-sub">Protected by Stripe · PCI DSS Level 1</p>
          </div>
        </div>

        <button className="co-edit-cart-btn" onClick={onBack}>
          Edit cart
        </button>
      </div>
    </div>
  )
}

// ── Main checkout page ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading, emailVerified, isAdmin } = useAuth()
  const {
    cartItems, formatPrice, convertAmount, currency,
    orderNote, handleOrderNoteChange,
    paymentMethod, setPaymentMethod,
    handleCheckout: devCheckout, checkoutStatus,
  } = useCart()

  const [paymentState, setPaymentState] = useState('idle') // idle | success
  const pollingActiveRef = useRef(false)

  const totalUsd = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalConverted = cartItems.reduce((s, i) => s + convertAmount(i.price) * i.quantity, 0)
  const amountInCents = Math.round(totalConverted * 100)

  const handlePaymentSuccess = (_piId) => {
    pollingActiveRef.current = false
    setPaymentState('success')
  }

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
        <div className="co-success">
          <div className="co-success-icon">
            <CheckCircle size={64} strokeWidth={1.3} color="#10b981" />
          </div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your order. We'll get started right away.</p>
          <div className="co-success-actions">
            <button className="primary-btn" onClick={() => router.push('/orders')}>
              View My Orders
            </button>
            <a
              href="https://discord.gg/zeusservices"
              className="co-discord-btn"
              target="_blank"
              rel="noreferrer"
            >
              Open Discord
            </a>
          </div>
          <p className="co-success-note">
            Join our Discord and open a ticket — your order will be processed there.<br />
            Your order appears in <strong>My Orders</strong> once confirmed.
          </p>
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
          <button onClick={() => router.push('/boosting')} className="primary-btn">
            Continue Shopping
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="section services co-page-wrap" id="checkout">
      {/* Page header */}
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

      {/* Wrap everything in Elements so both card fields and pay button share Stripe context */}
      <Elements stripe={stripePromise}>
        <CheckoutInner
          cartItems={cartItems}
          formatPrice={formatPrice}
          convertAmount={convertAmount}
          currency={currency}
          orderNote={orderNote}
          handleOrderNoteChange={handleOrderNoteChange}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleCheckout={devCheckout}
          checkoutStatus={checkoutStatus}
          totalUsd={totalUsd}
          totalConverted={totalConverted}
          amountInCents={amountInCents}
          emailVerified={emailVerified}
          isAdmin={isAdmin}
          user={user}
          onSuccess={handlePaymentSuccess}
          onBack={() => router.push('/cart')}
        />
      </Elements>
    </section>
  )
}
