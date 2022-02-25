const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
    },

    email: {
        type: String
    },
    password: {
        type: String
    },
    notifications: {
        all: [
            {
                type: Schema.Types.ObjectId,
                ref: 'notification'
            },
        ],
        recent: { type: Number, default: 0 }
    },
    date: {
        date: String,
        time: String
    },
    categories: [
        { type: String }
    ],
    expenses: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Expenses'
        }
    ],
    cards: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Card'
        }
    ]


});

module.exports = mongoose.model("User", userSchema);
