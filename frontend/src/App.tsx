import { useEffect, useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  active: boolean
  recommendationScore?: number
  recommendationReasons?: string[]
  crossSellScore?: number
  crossSellReason?: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [crossSell, setCrossSell] = useState<Product[]>([])

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [paymentMessage, setPaymentMessage] = useState('')
  const [agentExplanation, setAgentExplanation] = useState('')
  const [intent, setIntent] = useState('')

  const [productsLoading, setProductsLoading] = useState(true)

  /*
   * ---------------------------------------------------------
   * LOAD PRODUCTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true)

        const response = await fetch(
          `${API_BASE_URL}/api/products`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load products'
          )
        }

        if (Array.isArray(data.products)) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error(
          'PRODUCT FETCH ERROR:',
          error
        )
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [])

  /*
   * ---------------------------------------------------------
   * AI RECOMMENDATIONS
   * ---------------------------------------------------------
   */

  const getRecommendations = async () => {
    if (!message.trim() || loading) return

    setLoading(true)

    setRecommendations([])
    setCrossSell([])
    setAgentExplanation('')
    setIntent('')
    setPaymentMessage('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/agent/recommend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'Unable to get recommendations'
        )
      }

      setRecommendations(
        Array.isArray(data.recommendations)
          ? data.recommendations
          : []
      )

      setCrossSell(
        Array.isArray(data.crossSell)
          ? data.crossSell
          : []
      )

      setAgentExplanation(
        data.explanation || ''
      )

      setIntent(
        data.understanding?.intent || ''
      )

      /*
       * Scroll to recommendations after AI responds.
       */
      setTimeout(() => {
        document
          .getElementById('recommendations')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 100)
    } catch (error) {
      console.error(
        'RECOMMENDATION ERROR:',
        error
      )

      setAgentExplanation(
        'Unable to get AI recommendations. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * ---------------------------------------------------------
   * QUICK SEARCH
   * ---------------------------------------------------------
   */

  const useQuickSearch = (text: string) => {
    setMessage(text)

    setTimeout(() => {
      document
        .getElementById('ai-search')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
    }, 50)
  }

  /*
   * ---------------------------------------------------------
   * RAZORPAY SCRIPT
   * ---------------------------------------------------------
   */

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const existingScript =
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        )

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          () => resolve(true)
        )

        existingScript.addEventListener(
          'error',
          () => resolve(false)
        )

        return
      }

      const script =
        document.createElement('script')

      script.src =
        'https://checkout.razorpay.com/v1/checkout.js'

      script.async = true

      script.onload = () => resolve(true)

      script.onerror = () => resolve(false)

      document.body.appendChild(script)
    })
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT
   * ---------------------------------------------------------
   */

  const handlePayment = async (
    product: Product
  ) => {
    try {
      setPaymentMessage(
        `Preparing secure checkout for ${product.name}...`
      )

      const loaded =
        await loadRazorpay()

      if (!loaded) {
        setPaymentMessage(
          'Unable to load Razorpay Checkout.'
        )
        return
      }

      const orderResponse =
        await fetch(
          `${API_BASE_URL}/api/payment/create-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              amount: product.price,
            }),
          }
        )

      const orderData =
        await orderResponse.json()

      if (
        !orderResponse.ok ||
        !orderData.success
      ) {
        throw new Error(
          orderData.error ||
            'Failed to create order'
        )
      }

      const options = {
        key: import.meta.env
          .VITE_RAZORPAY_KEY_ID,

        amount:
          orderData.order.amount,

        currency:
          orderData.order.currency,

        name: 'RazorGrowth',

        description:
          product.name,

        order_id:
          orderData.order.id,

        handler: async (
          response: any
        ) => {
          try {
            setPaymentMessage(
              'Payment successful. Verifying securely...'
            )

            const verifyResponse =
              await fetch(
                `${API_BASE_URL}/api/payment/verify`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type':
                      'application/json',
                  },
                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,
                  }),
                }
              )

            const verifyData =
              await verifyResponse.json()

            if (
              verifyResponse.ok &&
              verifyData.verified
            ) {
              setPaymentMessage(
                '✅ Payment verified successfully!'
              )
              // Tell the dashboard to refresh its data
              window.dispatchEvent(
                new Event('payment-success')
              )
            } else {
              setPaymentMessage(
                '❌ Payment verification failed.'
              )
            }
          } catch (error) {
            console.error(
              'PAYMENT VERIFICATION ERROR:',
              error
            )

            setPaymentMessage(
              '❌ Payment verification failed.'
            )
          }
        },

        prefill: {
          name: 'Demo Customer',
          email:
            'customer@example.com',
          contact:
            '9999999999',
        },

        theme: {
          color: '#b47a3c',
        },

        modal: {
          ondismiss: () => {
            setPaymentMessage('')
          },
        },
      }

      const razorpay =
        new window.Razorpay(options)

      razorpay.on(
        'payment.failed',
        (response: any) => {
          console.error(
            'PAYMENT FAILED:',
            response.error
          )

          setPaymentMessage(
            '❌ Payment failed. Please try again.'
          )
        }
      )

      razorpay.open()

      setPaymentMessage('')
    } catch (error) {
      console.error(
        'PAYMENT ERROR:',
        error
      )

      setPaymentMessage(
        'Unable to start payment.'
      )
    }
  }

  /*
   * ---------------------------------------------------------
   * FORMAT PRICE
   * ---------------------------------------------------------
   */

  const formatPrice = (
    price: number
  ) => {
    return `₹${(
      price / 100
    ).toLocaleString('en-IN')}`
  }

  /*
   * ---------------------------------------------------------
   * PRODUCT CARD
   * ---------------------------------------------------------
   */

  const ProductCard = ({
    product,
    showAI = false,
    crossSellCard = false,
  }: {
    product: Product
    showAI?: boolean
    crossSellCard?: boolean
  }) => {
    return (
      <article
        className={`product-card ${
          showAI
            ? 'product-card-ai'
            : ''
        } ${
          crossSellCard
            ? 'product-card-cross'
            : ''
        }`}
      >
        <div className="product-card-top">
          <span className="product-category">
            {product.category}
          </span>

          {showAI &&
            product.recommendationScore !==
              undefined && (
              <span className="match-badge">
                AI {product.recommendationScore}%
              </span>
            )}
        </div>

        <div className="product-icon">
          {product.category
            .toLowerCase()
            .includes('headphone')
            ? '◉'
            : product.category
                .toLowerCase()
                .includes(
                  'accessor'
                )
            ? '◇'
            : '◆'}
        </div>

        <h3>{product.name}</h3>

        <p className="product-description">
          {product.description}
        </p>

        {showAI &&
          product.recommendationReasons &&
          product.recommendationReasons
            .length > 0 && (
            <div className="ai-insight">
              <div className="ai-insight-title">
                <span>✦</span>
                Why this matches
              </div>

              <ul>
                {product.recommendationReasons.map(
                  (
                    reason,
                    index
                  ) => (
                    <li
                      key={`${product.id}-reason-${index}`}
                    >
                      {reason}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

        {crossSellCard &&
          product.crossSellReason && (
            <div className="cross-insight">
              <div className="cross-insight-title">
                <span>+</span>
                Smart add-on
              </div>

              <p>
                {
                  product.crossSellReason
                }
              </p>
            </div>
          )}

        <div className="product-footer">
          <div>
            <span className="price-label">
              Price
            </span>

            <strong className="product-price">
              {formatPrice(
                product.price
              )}
            </strong>
          </div>

          <span
            className={`stock ${
              product.stock <= 5
                ? 'stock-low'
                : ''
            }`}
          >
            {product.stock} in stock
          </span>
        </div>

        <button
          className="buy-button"
          onClick={() =>
            handlePayment(product)
          }
          disabled={
            product.stock <= 0
          }
          aria-label={`Buy ${product.name}`}
        >
          <span>
            {product.stock <= 0
              ? 'Out of Stock'
              : 'Buy Now'}
          </span>

          {product.stock > 0 && (
            <span className="button-arrow">
              →
            </span>
          )}
        </button>
      </article>
    )
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <div className="app">
      {/* ================= HEADER ================= */}

      <header className="site-header">
        <div className="header-inner">
          <a
            href="#top"
            className="brand"
            aria-label="RazorGrowth home"
          >
            <div className="brand-mark">
              RG
            </div>

            <div className="brand-text">
              <span className="brand-name">
                RazorGrowth
              </span>

              <span className="brand-subtitle">
                AI Commerce Agent
              </span>
            </div>
          </a>

          <div className="header-status">
            <span className="status-dot" />
            <span>
              AI Agent Online
            </span>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ================= HERO ================= */}

        <section
          className="hero-section"
          id="ai-search"
        >
          <div className="hero-background-glow" />

          <div className="main-container hero-container">
            <div className="hero-content">
              <div className="eyebrow">
                <span>✦</span>
                Intelligent Shopping
                Assistant
              </div>

              <h1>
                Find the right product,
                <br />
                <span>
                  powered by AI.
                </span>
              </h1>

              <p className="hero-description">
                Tell RazorGrowth what
                you're looking for. Our AI
                agent analyzes your intent,
                budget and product
                availability to find the
                best match.
              </p>

              {/* SEARCH */}

              <div className="ai-search-wrapper">
                <div className="ai-search">
                  <span className="search-icon">
                    ✦
                  </span>

                  <input
                    type="text"
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        'Enter'
                      ) {
                        getRecommendations()
                      }
                    }}
                    placeholder="e.g. I want wireless headphones under ₹5000"
                    aria-label="Describe the product you are looking for"
                  />

                  <button
                    onClick={
                      getRecommendations
                    }
                    disabled={
                      loading ||
                      !message.trim()
                    }
                    className="ask-ai-button"
                  >
                    {loading
                      ? 'Thinking...'
                      : 'Ask AI'}

                    {!loading && (
                      <span>
                        →
                      </span>
                    )}
                  </button>
                </div>

                <div className="quick-searches">
                  <span>
                    Try:
                  </span>

                  <button
                    onClick={() =>
                      useQuickSearch(
                        'I want wireless headphones'
                      )
                  }
                  >
                    🎧 Wireless headphones
                  </button>

                  <button
                    onClick={() =>
                      useQuickSearch(
                        'I want accessories'
                      )
                    }
                  >
                    🔌 Accessories
                  </button>

                  <button
                    onClick={() =>
                      useQuickSearch(
                        'I want products under 5000'
                      )
                    }
                  >
                    💰 Under ₹5000
                  </button>
                </div>
              </div>
            </div>

            {/* HERO SIDE STATS */}

            <div className="hero-panel">
              <div className="hero-panel-top">
                <span className="panel-label">
                  AI ENGINE
                </span>

                <span className="live-pill">
                  LIVE
                </span>
              </div>

              <div className="agent-visual">
                <div className="agent-ring ring-one" />
                <div className="agent-ring ring-two" />
                <div className="agent-core">
                  ✦
                </div>
              </div>

              <h3>
                Smart Product
                Matching
              </h3>

              <p>
                Intent + Budget +
                Availability
              </p>

              <div className="panel-line" />

              <div className="hero-metrics">
                <div>
                  <strong>
                    {products.length}
                  </strong>

                  <span>
                    Products
                  </span>
                </div>

                <div>
                  <strong>
                    AI
                  </strong>

                  <span>
                    Powered
                  </span>
                </div>

                <div>
                  <strong>
                    ₹
                  </strong>

                  <span>
                    Secure Pay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PAYMENT STATUS ================= */}

        {paymentMessage && (
          <div className="main-container">
            <div className="payment-message">
              <span className="payment-message-icon">
                ✓
              </span>

              <span>
                {paymentMessage}
              </span>
            </div>
          </div>
        )}

        {/* ================= AI RESPONSE ================= */}

        {(intent ||
          agentExplanation) && (
          <section className="section ai-response-section">
            <div className="main-container">
              <div className="ai-response-card">
                <div className="response-icon">
                  ✦
                </div>

                <div className="response-content">
                  <div className="response-heading">
                    <span>
                      RazorGrowth AI
                    </span>

                    {intent && (
                      <span className="intent-badge">
                        {intent}
                      </span>
                    )}
                  </div>

                  {agentExplanation && (
                    <p>
                      {agentExplanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= AI RECOMMENDATIONS ================= */}

        {recommendations.length >
          0 && (
          <section
            className="section recommendations-section"
            id="recommendations"
          >
            <div className="main-container">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">
                    PERSONALIZED FOR YOU
                  </span>

                  <h2>
                    AI Recommendations
                  </h2>

                  <p>
                    Products ranked according
                    to your request.
                  </p>
                </div>

                <div className="result-count">
                  {recommendations.length}{' '}
                  matches
                </div>
              </div>

              <div className="products-grid">
                {recommendations.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      showAI
                    />
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================= CROSS SELL ================= */}

        {crossSell.length > 0 && (
          <section className="section cross-sell-section">
            <div className="main-container">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">
                    SMART CROSS-SELL
                  </span>

                  <h2>
                    Complete your setup
                  </h2>

                  <p>
                    Complementary products
                    selected by the AI agent.
                  </p>
                </div>
              </div>

              <div className="products-grid">
                {crossSell.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      crossSellCard
                    />
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================= STORE CATALOG ================= */}

        <section
          className="section catalog-section"
          id="catalog"
        >
          <div className="main-container">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  STORE CATALOG
                </span>

                <h2>
                  All Products
                </h2>

                <p>
                  Browse the complete
                  product catalog.
                </p>
              </div>

              {!productsLoading && (
                <div className="catalog-count">
                  <strong>
                    {products.length}
                  </strong>

                  <span>
                    products available
                  </span>
                </div>
              )}
            </div>

            {productsLoading ? (
              <div className="loading-grid">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      className="skeleton-card"
                      key={item}
                    >
                      <div className="skeleton skeleton-small" />
                      <div className="skeleton skeleton-icon" />
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text" />
                      <div className="skeleton skeleton-text short" />
                      <div className="skeleton skeleton-button" />
                    </div>
                  )
                )}
              </div>
            ) : products.length > 0 ? (
              <div className="products-grid">
                {products.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div>◇</div>
                <h3>
                  No products available
                </h3>
                <p>
                  The product catalog is
                  currently empty.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ================= MERCHANT DASHBOARD ================= */}

        <section
          className="dashboard-section"
          id="dashboard"
        >
          <div className="main-container">
            <div className="dashboard-header">
              <div>
                <span className="section-eyebrow">
                  MERCHANT CONTROL CENTER
                </span>

                <h2>
                  Growth Dashboard
                </h2>

                <p>
                  Monitor recommendations,
                  payments and AI-driven
                  growth activity.
                </p>
              </div>
            </div>

            <div className="dashboard-wrapper">
              <Dashboard />
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}

      <footer className="site-footer">
        <div className="main-container footer-inner">
          <div>
            <div className="footer-brand">
              <div className="brand-mark small">
                RG
              </div>

              <span>
                RazorGrowth
              </span>
            </div>

            <p>
              AI-powered commerce growth
              infrastructure.
            </p>
          </div>

          <div className="footer-right">
            <span>
              AI Agent Online
            </span>

            <span>
              •
            </span>

            <span>
              Secure Payments
            </span>

            <span>
              •
            </span>

            <span>
              2026 RazorGrowth
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App