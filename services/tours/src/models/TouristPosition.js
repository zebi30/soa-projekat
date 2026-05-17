const mongoose = require("mongoose");

const TouristPositionSchema = new mongoose.Schema(
  {
    touristId: {
      type: String,
      required: true,
      unique: true,
      index: true
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
    }
  },
  { timestamps: true }
);

TouristPositionSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model("TouristPosition", TouristPositionSchema);
