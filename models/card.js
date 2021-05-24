const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cardSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'onModel',
        required: true
    },
    name: String,
    image: String,
    balance: { type: Number, required: true, default: 0 },
    limit: { type: Number, default: 0 },
    transaction: [{
        for: {
            id: {
                type: Schema.Types.ObjectId,
                ref: 'onModel'
            },
            name: String
        },
        transactionType: String,
        amount: Number,
        date: String,
        time: String,
        description: String
    }],
    date: String
});


module.exports = mongoose.model("Card", cardSchema);