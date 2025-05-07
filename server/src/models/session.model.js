import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
const pointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  {
    _id: false,
  }
);
const sessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  ip: String,
  userAgent: String,
  refreshToken: {
    type: String,
    required: true,
  },
  location: {
    type: pointSchema,
  },
  address: {
    country: String,
    region: String,
    city: String,
    source: String,
  },
  device: {
    type: new Schema(
      {
        browser: {
          type: String,
          default: null,
        },
        os: {
          type: String,
          default: null,
        },
        model: {
          type: String,
          default: null,
        },
        type: {
          type: String,
          default: null,
        },
        cpu: {
          type: String,
          default: null,
        },
      },
      {
        _id: false,
        required: false,
      }
    ),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});
sessionSchema.index({
  location: "2dsphere",
});

sessionSchema.statics.findOldestByUserId = function (userId, limit = 5) {
  return this.find({ user: userId })
    .sort({ createdAt: 1 })
    .skip(limit)
    .exec();
};

sessionSchema.pre("save", async function (next) {
  if (this.isModified("refreshToken")) {
    const salt = await bcrypt.genSalt(10);
    this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
  }
  next();
});


sessionSchema.method("isValidRefreshToken", async function (plainToken) {
  return await bcrypt.compare(plainToken, this.refreshToken);
});


export default model("Session", sessionSchema);
