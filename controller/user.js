const newUser = require("../schema/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const ForgetPasswordEmail = require("../emailTemplate");

const Signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    let existingUser = await newUser.findOne({ email });
    if (existingUser) {
      return res.send({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user = new newUser({
      email,
      password: hashedPassword,
    });

    let result = await user.save();

    result = result.toObject();
    delete result.password;

    res
      .status(201)
      .send({ message: "Account created successfully", user: result });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Something went wrong, please try again." });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await newUser.findOne({ email });
    if (!user) {
      return res.send({ message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send({ message: "Invalid password" });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    if (user) {
      jwt.sign(
        { user },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
        (err, token) => {
          if (err) {
            res.send({ message: "Something went wrong, please try again." });
          }
          res.status(201).send({
            message: "Login successful",
            user: userResponse,
            token: token,
          });
        }
      );
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Something went wrong, please try again." });
  }
};

const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.send({ message: "Please provide an email" });
    }

    // Check if the user exists
    const checkUser = await newUser.findOne({ email });
    if (!checkUser) {
      return res.send({ message: "User not found" });
    }

    // Generate JWT token
    const tokenEmail = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });

    // Prepare email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.OWNER_EMAIL, // Use environment variables
        pass: process.env.OWNER_PASS,
      },
    });

    // Email options

    const html = ForgetPasswordEmail.email(
      "http://localhost:3000/auth/resetPassword",
      tokenEmail
    );

    const emailOptions = {
      from: process.env.OWNER_EMAIL,
      to: email,
      subject: "Here's your password reset link!",
      text: "click on Button to Reset ",
      html: html,
    };

    // Send the email
    await transporter.sendMail(emailOptions);

    return res.status(201).send({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error in ForgetPassword:", error.message);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const ResetPassword = async (req, res) => {
  try {
    const { tokenEmail: token } = req.params;
    const { newPassword } = req.body;

    // Validate inputs
    if (!token || !newPassword) {
      return res.send({ message: "Invalid request" });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.send({ message: "Invalid or expired token" });
    }

    // Extract email from the token
    const { email } = decoded;

    // Find user by email
    const user = await newUser.findOne({ email });
    if (!user) {
      return res.send({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(201).send({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in ResetPassword:", error.message);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = {
  Signup,
  Login,
  ForgotPassword,
  ResetPassword,
};
