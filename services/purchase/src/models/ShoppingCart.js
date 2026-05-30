const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    tourId: {
      type: String,
      required: true
    },
    tourName: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

const ShoppingCartSchema = new mongoose.Schema(
  {
    touristId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [OrderItemSchema],
      default: []
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

ShoppingCartSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    if (Array.isArray(ret.items)) {
      ret.items = ret.items.map((item) => {
        const { _id, ...rest } = item;
        return { id: _id, ...rest };
      });
    }
    return ret;
  }
});

module.exports = mongoose.model("ShoppingCart", ShoppingCartSchema);
