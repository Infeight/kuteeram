
const otpGenerator = require("otp-generator");
const twilio = require("twilio");
const Buyer = require("../models/buyer.model");
const jwt = require('jsonwebtoken')


const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


const sendOTP = async (req, res) => {
  try {
    const { phonenumber } = req.body;

    if (!phonenumber) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }


    //otp generation
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    const otpexpiry = new Date();
    otpexpiry.setMinutes(otpexpiry.getMinutes() + 10);

    let user = await Buyer.findOne({ phonenumber });

    if (user) {
     
      user = await Buyer.findOneAndUpdate(
        { phonenumber },
        { otp, otpexpiry, isLoggedin: false },
        { new: true }
      );
    } else {
      res.status(404).json({
        success: false,
        message: "buyer not found",
      });
      return;
    }

    await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phonenumber,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: { phonenumber },
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};


const verifyOTP = async (req, res) => {
  try {
    const { phonenumber, otp } = req.body;

    if (!phonenumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const user = await Buyer.findOne({ phonenumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "buyer not found",
      });
    }

    if (user.otpexpiry && new Date() > user.otpexpiry) {
      return res.status(401).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.otp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    role = user.role;

    const token = jwt.sign(
      {
        userId: user._id,
        phoneNumber: user.phonenumber,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      name: "token",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Update user status
    await Buyer.findOneAndUpdate(
      { phonenumber },
      { isLoggedin: true, otp: null, otpexpiry: null },
      { new: true }
    );


    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: { phonenumber, isLoggedin: true, role:role },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};




const registerbuyer = async (req, res) => {
  try {
    const {
      username,
      role,
      country,
      state,
      district,
      city,
      pincode,
      phonenumber,
      location,
    } = req.body;

    if (
      !username ||
      !role ||
      !country||
      !state ||
      !district ||
      !city ||
      !pincode ||
      !phonenumber ||
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all required fields." });
    }

    const exists = await Buyer.findOne({
      $or: [{ username }, { phonenumber }],
    });
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "Username or phone already in use." });
    }

    const newbuyer = new Buyer({
      username,
      role,
      country,
      state,
      district,
      city,
      pincode,
      phonenumber,
      location,
      isLoggedin: false,
    });

    await newbuyer.save();

    return res.status(201).json({
      success: true,
      message: "buyer registered successfully.",
      buyerId: newbuyer._id,
    });
  } catch (error) {
    console.error("Error in registerbuyer:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};



module.exports = {sendOTP,verifyOTP,registerbuyer}