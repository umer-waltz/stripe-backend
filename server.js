require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static('public'));

// Use raw body parsing for webhook route
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('Webhook event received:', event.type);

        if (event.type === 'checkout.session.completed') {
            console.log('✅ Payment was successful:', event.data.object);
        }

        res.status(200).send('Webhook received');
    } catch (err) {
        console.error('⚠️ Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Use JSON parsing for all other routes
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Stripe Checkout API is running');
});

app.post('/checkout', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Node.js and Express Book'
                        },
                        unit_amount: 5000
                    },
                    quantity: 1
                },
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'JavaScript T-Shirt'
                        },
                        unit_amount: 2000
                    },
                    quantity: 2
                }
            ],
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['US', 'BR']
            },
            success_url: `https://www.youtube.com/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://www.youtube.com/cancel`
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send('Something went wrong');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));