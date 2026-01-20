import Cart from '../components/Cart'
import '../App.css'

export default function CartPage({ cartItems, removeFromCart, updateQuantity, onCheckout, checkoutStatus, currency, formatPrice, paymentMethod, onPaymentMethodChange, isDevUser }) {
  return (
    <section className="section services" id="cart">
      <p className="eyebrow">Cart</p>
      <h2 className="section-title">Your selections</h2>
      <p className="section-subtitle">Adjust quantities or remove items before checkout.</p>
      <Cart
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={onCheckout}
        checkoutStatus={checkoutStatus}
        currency={currency}
        formatPrice={formatPrice}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={onPaymentMethodChange}
        isDevUser={isDevUser}
      />
    </section>
  )
}
