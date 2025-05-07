import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
const oauthProviderSchema = new Schema({
  provider: {
    type: String,
    required: true,
    enum: ["google", "facebook", "twitter", "github"]
  },
  profileId: {
    type: String,
    required: true
  }
}, {
  _id: false
});
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String
  },
  isPasswordSet: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isProfileCompleted: {
    type: Boolean, 
    default: false,
  },
  avatar: String,
  oauthProviders: [oauthProviderSchema]
}, {
  timestamps: true,
  virtuals: true
});
userSchema.statics.findByEmailOrOauthProvider = async function (email, profileId, provider) {
  return this.findOne({
    $or: [{
      email
    }, {
      oauthProviders: {
        $elemMatch: {
          provider,
          profileId
        }
      }
    }]
  });
};


userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.linkOauthProvider = async function (id, provider, photo) {
  if (!id || !provider) {
    throw new Error("Invalid profile information");
  }

  const alreadyLinked = this.oauthProviders.some(({
    profileId,
    provider: linkedProvider
  }) => {
    return profileId === id && linkedProvider === provider;
  });

  if (!alreadyLinked) {
    try {
      await this.updateOne({
        $addToSet: {
          oauthProviders: {
            provider: provider,
            profileId: id
          }
        },
        $set: {
          avatar: this.avatar || photo || null
        }
      });

      return true;
    } catch (error) {
      throw new Error("Failed to link OAuth provider");
    }
  }
  return {
    linked: false,
    message: "Provider already linked"
  };
};

export let ROLES = /*#__PURE__*/function (ROLES) {
  ROLES["PATIENT"] = "patient";
  ROLES["DOCTOR"] = "doctor";
  ROLES["ADMIN"] = "admin";
  return ROLES;
}({});
export default model("User", userSchema);