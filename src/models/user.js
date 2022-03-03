
const mongoose = require('../database/mongoose');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./tasks');


const validator = require('validator');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('please enter a valid email');
            }
        },
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('avoid using password or increase password length');
            }
        }
    },
    avatar: {
        type: Buffer
    },
    age: {
        type: Number,
        required: true,
        validate(value) {
            if (value < 0) {
                throw new Error('age must be greater than 0')
            }
        },
        default: 0,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

userSchema.set('toObject', { virtual: true })
userSchema.set('toJSON', { virtual: true })

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});


userSchema.methods.toJSON = function () {
    const userObj = this.toObject();

    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;

    return userObj
}


userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this.id.toString() }, 'musataskapp', { expiresIn: '7 days' });

    // user.tokens = user.tokens.concat({ token });

    // user.tokens = user.tokens.push({ token })

    // await user.save();

    return token;

}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('unable to login')
    }
    return user;
}

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }
    next();
});

userSchema.pre('remove', async function (next) {
    await Task.deleteMany({ owner: this._id });

    next()
})

const User = mongoose.model('User', userSchema);

module.exports = User;


