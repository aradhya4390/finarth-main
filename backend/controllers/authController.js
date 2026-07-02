// controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

// POST /api/auth/signup
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already used" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hash, // <-- schema se match
    });

    const token = signToken({ id: user._id });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user._id });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
}

// GET /api/auth/me  (protected)
export async function me(req, res) {
  try {
    // req.userId ko auth middleware se set karna hoga (decoded token se)
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // frontend ko clean object bhej do
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

// POST /api/auth/update-profile (protected)
export async function updateProfile(req, res) {
  try {
    const updates = req.body || {};
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If email is changing, ensure it's not already taken by another user
    if (updates.email && updates.email !== user.email) {
      const other = await User.findOne({ email: updates.email });
      if (other && String(other._id) !== String(user._id)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = updates.email;
    }

    if (updates.name) user.name = updates.name;

    // Support password change: caller sends { password: 'newpass' }
    if (updates.password) {
      const hash = await bcrypt.hash(updates.password, 10);
      user.passwordHash = hash;
    }

    // Save changes
    await user.save();

    // Return cleaned user object
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}
