const mongoose = require("mongoose");

const TourPurchaseTokenSchema = new mongoose.Schema(
  {
    touristId: {
      type: String,
      required: true,
      index: true
    },
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
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

TourPurchaseTokenSchema.index({ touristId: 1, tourId: 1 }, { unique: true });

TourPurchaseTokenSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("TourPurchaseToken", TourPurchaseTokenSchema);
