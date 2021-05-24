const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const connection = mongoose.createConnection(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@onlineshop-zsiuv.mongodb.net/${process.env.DATABASE_URL}`);

autoIncrement.initialize(connection);

const billSchema = new Schema({

    billtype: String,
    category: String,
    user: {
        id: {
            type: Schema.Types.ObjectId,
            refPath: 'OnModel'
        },
        name: String,
    },
    notes: String,
    amount: Number,
    date: String,
    duo: String,
    release_date: String,
    approved: Boolean,
    status: {
        paid: Boolean,
        note: String,
        date: String,
        changedBy: {
            id: {
                type: Schema.Types.ObjectId,
                refPath: 'OnModel'
            },
            name: String,
        }
    },
    creator: {
        name: String,
        id: { type: Schema.Types.ObjectId, ref: 'OnModel' }
    },

    card: {
        type: Schema.Types.ObjectId,
        refPath: 'Card',
    }

}, { timestamps: true });
billSchema.plugin(autoIncrement.plugin, {
    model: 'bill',
    field: 'serialNo',
    startAt: 10000,
    incrementBy: 1
});

module.exports = mongoose.model("Bill", billSchema);

