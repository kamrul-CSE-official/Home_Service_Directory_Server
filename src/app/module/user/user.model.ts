import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
  },
  email: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  education: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  gender: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  motherName: {
    type: String,
    required: true,
  },
  adderss: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  responsible: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  expertise: {
    type: [String],
    required: true,
  },
  expecting: {
    type: [String],
    required: true,
  },
  threeMainExpertise: {
    type: [String],
    required: true,
  },
  packages: {
    package1: {
      type: String,
      required: true,
    },
    package2: {
      type: String,
      required: true,
    },
    package3: {
      type: String,
      required: true,
    },
  },
  prices: {
    price1: {
      type: Number,
      required: true,
    },
    price2: {
      type: Number,
      required: true,
    },
    price3: {
      type: Number,
      required: true,
    },
  },
  rating: {
    type: Number,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  cover1: {
    type: String,
    required: true,
  },
  cover2: {
    type: String,
    required: true,
  },
});

const User = model<IUser>("User", userSchema);

export default User;
