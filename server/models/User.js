/**
 * models/User.js
 * 
 * Defines the schema for application users.
 * Roles supported:
 *  - 'admin' (School Librarian / Supervisor)
 *  - 'volunteer' (Braille Transcriber)
 * 
 * Includes pre-save password hashing and password verification methods using bcrypt.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Do not include password by default in queries for security
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'volunteer'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'volunteer'
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

// Mongoose Pre-save Hook: automatically hash the password before saving to the DB
userSchema.pre('save', async function (next) {
  // Only hash if the password field has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance Method: Compare entered password with stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
