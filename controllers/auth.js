const User = require("../models/User");
const Card = require("../models/Card");
const bcrypt = require("bcryptjs");
// const { validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");
// const { google } = require("googleapis");
// const socket = require('../index').socket
const moment = require('moment')
// const OAuth2Data = require('../google_key.json')

exports.singup = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    if (email === '' || password === '' || name === '') {
        return res.status(422).json({ message: 'All Stared fields <span class="c-r">*</span> requried', messageType: 'info' })
    }
    const existUser = await User.findOne({ $or: [{ email: email }, { name: name }] })
    console.log(existUser);

    if (existUser)
        return res.status(422).json({ message: 'Email Already exsist, if its you click forget password below', messageType: 'warning' })

    if (password != confirmpassword)
        return res.status(422).json({ message: 'Password not matched', messageType: 'info' })

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        expenses: [],
        notifications: {
            all: [],
            recent: 0
        },
    });
    await user.save()

    const newCard = new Card({
        user: user._id,
        name: 'Main',
        limit: 0,
        balance: 0,
        processes: [],
        date: moment(new Date).format('YYYY-MM-DD')
    })
    await newCard.save()

    return res.status(200).json({ message: 'Successfully singed up', messageType: 'success' })

};

exports.login = async (req, res, next) => {
    console.log('logging');

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: 'Your Information not correct', messageType: 'error' })
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            return res.status(404).json({ message: 'Your Information not correct', messageType: 'error' })
        }
        const token = jwt.sign(
            {
                isLoggedIn: true,
                user: { _id: user._id, name: user.name, }
            },

            "SomeSuperAsecretBymy",
        );
        req.user = { _id: user._id, name: user.name, }
        req.isLoggedIn = true;
        return res.status(200).json({ token: token, userId: user._id.toString(), name: user.name, });

    } catch (error) {
        console.log(error);

        return res.status(500).json({ message: 'Something went wrong. Please try again later', messageType: 'error' })
    }
}


exports.getCheckout = async (req, res, next) => {
    const planNo = req.body.planNo
    const planPeriod = req.body.period
    const plan = await Plan.findOne({ planNumber: planNo })

    stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
            return {
                amount: p.productId.price * 100,
                currency: 'eg',
            };
        }),
        success_url: 'http://localhost:3000/checkout/success',
        cancel_url: 'http://localhost:3000/checkout/cancel'
    });
    //     .then(session => {
    //     console.log(session);
    //     res.render('shop/checkout', {
    //         path: '/checkout',
    //         pageTitle: 'Checkout',
    //         products: products,
    //         totalSum: total,
    //         sessionId: session.id
    //     });
    // })

};


exports.getCheckoutSuccess = (req, res, next) => {
    let totalSum = 0;
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            user.cart.items.forEach(p => {
                totalSum += p.quantity * p.productId.price;
            });

            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    name: req.user.name,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            console.log(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getUser = async (req, res, next) => {
    const userId = req.params.id;

    try {
        const user = await User.findOne({ _id: userId });
        if (!user) {
            const error = new Error("Could not find user.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ user: user });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};



exports.getSignWithGoogle = (req, res, next) => {
    console.log(OAuth2Data.web);

    const CLIENT_ID = OAuth2Data.web.client_id;
    const CLIENT_SECRET = OAuth2Data.web.client_secret;
    const REDIRECT_URL = OAuth2Data.web.redirect_uris;
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
    var authed = false;

    if (!authed) {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/gmail.readonly'
        });
        console.log(url)
        res.redirect(url);
    } else {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        gmail.users.labels.list({
            userId: 'me',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const labels = res.data.labels;
            if (labels.length) {
                console.log('Labels:');
                labels.forEach((label) => {
                    console.log(`- ${label.name}`);
                });
            } else {
                console.log('No labels found.');
            }
        });
        res.send('Logged in')
    }
};
exports.getCallBack = async (req, res, next) => {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/')
            }
        });
    }
};
