import { Router } from 'express'
import { query } from '../prisma/db.js'
import { addAuditEvent } from './audit.js'

const router = Router()

router.post('/recommend', async (req, res) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      })
    }

    const cleanMessage = message.trim()

    // Record customer request
    addAuditEvent(
      'AI_REQUEST',
      `Customer requested: "${cleanMessage}"`,
      'info'
    )

    const products = await query<any>(`
      SELECT
        id,
        "merchantId",
        name,
        description,
        price,
        category,
        stock,
        active,
        "createdAt"
      FROM product
      WHERE active = true
      AND stock > 0
      ORDER BY "createdAt" DESC
    `)

    const text = cleanMessage.toLowerCase()

    // -----------------------------
    // Understand customer intent
    // -----------------------------

    const wantsHeadphones =
      text.includes('headphone') ||
      text.includes('headphones')

    const wantsWireless =
      text.includes('wireless')

    const budgetMatch =
      text.match(
        /(?:under|below|less than|max(?:imum)?|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i
      )

    const maxPrice = budgetMatch
      ? Number(budgetMatch[1]) * 100
      : null

    const category =
      wantsHeadphones
        ? 'headphones'
        : null

    const intent =
      wantsHeadphones
        ? 'HEADPHONES'
        : 'GENERAL_PRODUCT_SEARCH'

    addAuditEvent(
      'INTENT_DETECTED',
      `Intent: ${intent}${category ? ` | Category: ${category}` : ''}${maxPrice !== null ? ` | Budget: ₹${maxPrice / 100}` : ''}`,
      'success'
    )

    // -----------------------------
    // Recommendation scoring
    // -----------------------------

    let recommendations = products
      .map((product: any) => {
        let score = 0

        const reasons: string[] = []

        const name =
          String(product.name || '').toLowerCase()

        const description =
          String(
            product.description || ''
          ).toLowerCase()

        const productCategory =
          String(
            product.category || ''
          ).toLowerCase()

        // Category match
        if (
          category &&
          productCategory === category
        ) {
          score += 50

          reasons.push(
            'Matches your requested category'
          )
        }

        // Headphone keyword
        if (
          wantsHeadphones &&
          (name.includes('headphone') ||
            description.includes('headphone'))
        ) {
          score += 25

          reasons.push(
            'Matches your headphone request'
          )
        }

        // Wireless preference
        if (
          wantsWireless &&
          (name.includes('wireless') ||
            description.includes('wireless'))
        ) {
          score += 20

          reasons.push(
            'Matches your wireless preference'
          )
        }

        // Budget
        if (
          maxPrice !== null
        ) {
          if (
            Number(product.price) <=
            maxPrice
          ) {
            score += 25

            reasons.push(
              'Within your requested budget'
            )
          } else {
            score -= 30
          }
        }

        // Stock availability
        if (
          Number(product.stock) >= 20
        ) {
          score += 10

          reasons.push(
            'Good stock availability'
          )
        } else if (
          Number(product.stock) > 0
        ) {
          score += 5

          reasons.push(
            'Currently in stock'
          )
        }

        return {
          ...product,
          recommendationScore: score,
          recommendationReasons: reasons,
        }
      })
      .sort(
        (
          a: any,
          b: any
        ) =>
          b.recommendationScore -
          a.recommendationScore
      )

    // If budget exists, keep relevant products
    if (
      maxPrice !== null
    ) {
      const affordable =
        recommendations.filter(
          (product: any) =>
            Number(product.price) <=
            maxPrice
        )

      if (affordable.length > 0) {
        recommendations =
          affordable
      }
    }

    // Remove products with zero/negative relevance
    const relevantRecommendations =
      recommendations.filter(
        (product: any) =>
          product.recommendationScore > 0
      )

    recommendations =
      relevantRecommendations.length > 0
        ? relevantRecommendations
        : recommendations

    // Limit recommendation count
    recommendations =
      recommendations.slice(0, 5)

    // -----------------------------
    // Cross-sell
    // -----------------------------

    const crossSell =
      products
        .filter(
          (product: any) =>
            String(
              product.category || ''
            ).toLowerCase() ===
            'accessories'
        )
        .map((product: any) => ({
          ...product,

          crossSellScore: 85,

          crossSellReason:
            'Customers buying headphones may also need this accessory.',
        }))
        .sort(
          (
            a: any,
            b: any
          ) =>
            Number(b.stock) -
            Number(a.stock)
        )

    // -----------------------------
    // Audit events
    // -----------------------------

    addAuditEvent(
      'RECOMMENDATION',
      `Generated ${recommendations.length} product recommendation${recommendations.length === 1 ? '' : 's'}.`,
      'success'
    )

    addAuditEvent(
      'CROSS_SELL',
      `Identified ${crossSell.length} complementary product${crossSell.length === 1 ? '' : 's'}.`,
      'success'
    )

    // -----------------------------
    // Response
    // -----------------------------

    res.json({
      success: true,

      agent: {
        name: 'RazorGrowth Agent',
        version: '2.0',
      },

      understanding: {
        customerMessage:
          cleanMessage,

        intent,

        category,

        maxPrice:
          maxPrice !== null
            ? maxPrice / 100
            : null,
      },

      recommendations,

      crossSell,

      explanation:
        'Products were ranked using customer intent, category relevance, budget, product description and stock availability.',

      paymentAction: {
        allowed: false,

        reason:
          'Payment requires explicit customer confirmation.',
      },
    })
  } catch (error) {
    console.error(
      'AGENT ERROR:',
      error
    )

    addAuditEvent(
      'AI_ERROR',
      'AI recommendation request failed.',
      'failed'
    )

    res.status(500).json({
      success: false,
      error:
        'Agent failed to process request',
    })
  }
})

export default router