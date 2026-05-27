const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Package to setup fee mapping
const SETUP_FEES = {
  'price_1TbUaCC5eVIpgAssYsT6MVNq': 'price_1TbUUMC5eVIpgAssR5UDggwW', // Starter -> $500
  'price_1TbUbbC5eVIpgAssBGTwhNpR': 'price_1TbUUMC5eVIpgAssR5UDggwW', // Essential -> $500
  'price_1TbUdCC5eVIpgAssIttzSvUv': 'price_1TbUUMC5eVIpgAssR5UDggwW', // Pro -> $500
  'price_1TbUfPC5eVIpgAssDU99n1tK': 'price_1TbUVkC5eVIpgAssOuyWFjlA', // Advanced -> $750
  'price_1TbUgYC5eVIpgAssuGjiOjcb': 'price_1TbUXHC5eVIpgAss24ydlGj9', // Growth -> $1000
  'price_1TbUi1C5eVIpgAssLeaGLqrK': 'price_1TbUXHC5eVIpgAss24ydlGj9', // Power -> $1000
  'price_1TbUnFC5eVIpgAssE8IKQPqS': 'price_1TbUXHC5eVIpgAss24ydlGj9', // Elite -> $1000
  'price_1TbUokC5eVIpgAssFhD0kDV2': 'price_1TbUXHC5eVIpgAss24ydlGj9', // Commander -> $1000
  'price_1TbUqYC5eVIpgAsskxtSuNWe': 'price_1TbUXHC5eVIpgAss24ydlGj9', // Titan -> $1000
  'price_1TbUrXC5eVIpgAssAHSswPgb': 'price_1TbUXHC5eVIpgAss24ydlGj9', // Empire -> $1000
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { priceId, customerEmail, customerName, businessName } = JSON.parse(event.body);

    if (!priceId || !SETUP_FEES[priceId]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid package selected' })
      };
    }

    const setupFeePrice = SETUP_FEES[priceId];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price: setupFeePrice,
          quantity: 1,
        },
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          business_name: businessName || '',
          customer_name: customerName || '',
        },
      },
      metadata: {
        business_name: businessName || '',
        customer_name: customerName || '',
      },
      success_url: `${event.headers.origin || 'https://bluecollardemand.com'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || 'https://bluecollardemand.com'}/#pricing`,
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
