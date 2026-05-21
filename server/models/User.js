import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  headline: {
    type: String,
    default: 'Full Stack Developer',
    trim: true,
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  stack: {
    type: [String],
    default: ['JavaScript', 'React', 'Node.js'],
  },
  expLevel: {
    type: String,
    enum: ['Beginner', 'Mid Level', 'Senior', 'Expert'],
    default: 'Beginner',
  },
  focus: {
    type: String,
    enum: ['Full Stack Development', 'Frontend', 'Backend', 'Data Science', 'DevOps', 'Mobile'],
    default: 'Full Stack Development',
  },
  language: {
    type: String,
    default: 'English',
  },
  avatar: {
    type: String,
    default: '',
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  publicProfile: {
    type: Boolean,
    default: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'zenuxs'],
    default: 'local',
  },
  zenuxsId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;