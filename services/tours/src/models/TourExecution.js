const mongoose = require("mongoose");

const CompletedKeyPointSchema = new mongoose.Schema(
  {
    keyPointId: { type: String, required: true },
    completedAt: { type: Date, required: true }
  },
  { _id: false }
);

const TourExecutionSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
      index: true
    },
    touristId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active"
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    startLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    completedKeyPoints: {
      type: [CompletedKeyPointSchema],
      default: []
    },
    lastActivity: { type: Date, required: true }
  },
  { timestamps: true }
);

TourExecutionSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("TourExecution", TourExecutionSchema);
