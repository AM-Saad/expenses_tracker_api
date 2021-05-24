var mongoose = require("mongoose");
const Card = require("../models/Card");
const User = require("../models/User");
const moment = require('moment')

exports.createCard = async (req, res, next) => {
    const { name, limit, balance } = req.body
    try {
        const user = await User.findOne({ _id: req.user._id })
        const card = await Card.findOne({ user: req.user._id, name: name })
        if (!card) {
            const newCard = new Card({
                user: req.user._id,
                name: name,
                limit: limit,
                balance: balance,
                transaction: [],
                date: moment(new Date).format('YYYY-MM-DD')
            })
            await newCard.save()
            user.cards.push(newCard._id);
            await user.save()
            return res.json({ message: 'Card Created successfully', messageType: 'success', card: card })
        } else {
            return res.json({ message: 'You got Card with same name', messageType: 'success', card: card })

        }
    } catch (error) { return res.status(500).json({ message: 'Something went wrong, please try again later.', messageType: 'danger' }) }
}
exports.getCards = async (req, res, next) => {
    try {
        const cards = await Card.find({ user: req.user._id })
        return res.json({ cards: cards })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.', messageType: 'danger' })
    }
}
exports.getCard = async (req, res, next) => {
    const cardId = req.params.id;
    try {
        const card = await Card.findOne({ _id: cardId, user: req.user._id })
        return res.json(card)
    } catch (error) { return res.status(500).json({ message: 'Something went wrong, please try again later.', messageType: 'danger' }) }
}

exports.deposit = async (req, res, next) => {
    const amount = req.body.amount;
    const cardId = req.params.id;
    try {
        const card = await Card.findOne({ user: req.user._id, _id: cardId })
        card.balance += parseInt(amount, 10)
        let newprocess = {
            description: `<b>$${amount}</b> deposit to card "${card.name}:`,
            date: moment(new Date).format('MMMM Do YYYY'),
            time: moment(new Date).format('h:mm a'),
            amount: amount,
            transactionType: 'Deposit',
        }
        card.transaction.push(newprocess)
        await card.save()
        return res.status(200).json({ message: 'Transaction Compeleted', messageType: 'success', card: card })
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong, please try again later.', messageType: 'danger' })
    }
}

exports.withdraw = async (req, res, next) => {
    const amount = req.body.amount
    const withdrawfor = req.body.for
    const cardId = req.params.id

    try {
        const card = await Card.findOne({ _id: cardId })
        console.log(card);

        card.balance -= amount
        let newprocess = {
            amount: amount,
            description: `<b>$${amount}</b> withdrawed from card "${card.name}"`,
            date: moment(new Date).format('MMMM Do YYYY'),
            time: moment(new Date).format('h:mm a'),
            for: withdrawfor ? withdrawfor : null,
            transactionType: 'Withdraw'

        }
        console.log(newprocess);
        card.transaction.push(newprocess)

        await card.save()
        return res.status(200).json({ message: 'Transaction Compeleted', messageType: 'success', card: card })
    } catch (error) {
        console.log(error);

        return res.status(500).json({ message: 'Something went wrong, please try again later.', messageType: 'danger' })
    }
}

exports.deletetransaction = async (req, res, next) => {

}
exports.edittransaction = async (req, res, next) => {

}
