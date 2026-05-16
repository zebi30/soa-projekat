const mongoose = require("mongoose");

const KeyPointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"]
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    authorId: {
      type: String,
      required: true,
      index: true
    },
    keyPoints: {
      type: [KeyPointSchema],
      default: []
    }
  },
  { timestamps: true }
);

TourSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    if (Array.isArray(ret.keyPoints)) {
      ret.keyPoints = ret.keyPoints.map((kp) => {
        const { _id, ...rest } = kp;
        return { id: _id, ...rest };
      });
    }
    return ret;
  }
});

module.exports = mongoose.model("Tour", TourSchema);
