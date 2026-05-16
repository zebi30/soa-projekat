const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    touristId: {
      type: String,
      required: true
    },
    touristEmail: {
      type: String,
      required: true
    },
    visitedAt: {
      type: Date,
      required: true
    },
    images: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

ReviewSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("Review", ReviewSchema);
