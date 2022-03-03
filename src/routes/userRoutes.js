

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');


const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendBuyEmail } = require('../emails/accounts');

const router = new express.Router();

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });

        if (!user || !user.avatar) {
            throw new Error();

        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(400).send(e)
    }
})


router.post('/users', async (req, res, next) => {
    const { email } = req.body


    const user = new User(req.body);

    try {
        const userOne = await User.findOne({ email });
        const token = await user.generateAuthToken();


        if (userOne) {
            return res.send('user exists')
        }
        await user.save();
        sendWelcomeEmail(user)
        res.status(201).send({ user, token });

    } catch (error) {
        console.log(error);
        res.status(400).send(error)

    }
})



router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
    // const id = req.user._id;

    // try {
    //     User.findOne({ where: { id } }).then((user) => {
    //         res.send(user)
    //     })
    // } catch (error) {
    //     res.status(500).send({ error: 'user does not exist' })
    // }

})


router.patch('/users/me', auth, async (req, res, next) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password'];

    const isValidUpdates = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdates) {
        res.status(404).send();
    }

    try {

        updates.forEach((update) => req.user[update] = req.body[update]);


        await req.user.save();


        res.status(200).send(req.user);

    } catch (error) {
        res.status(400).send(error);
    }
})

router.delete('/users/me', auth, async (req, res) => {

    await req.user.remove();
    sendBuyEmail(req.user);
    res.send(`user deleted: ${req.user}`)
})

router.post('/users/login', async (req, res) => {
    // const email = req.body.email;
    // const password = req.body.password;
    const { email, password } = req.body
    // const user = await User.findOne({ email });

    // if (user) {
    //     return res.status(400).send('user exists')
    // }
    try {
        const user = await User.findByCredentials(email, password);
        const token = await user.generateAuthToken();

        // user.tokens = user.tokens.concat({ token });

        user.tokens.push({ token })

        await user.save();

        res.status(200).send({ user, token });

    } catch (error) {
        res.status(400).send({ error: 'unable to login here' })
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.status(200).send()

    } catch (error) {
        res.status(500).send(error)
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token === 'not_here'
        })

        await req.user.save();

        res.send()

    } catch (error) {
        res.status(500).send(error)
    }
});

const uploadProfile = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return callback(new Error('please upload a jpeg, png or jpg image file'))
        }
        callback(undefined, true)
    }
})


router.post('/users/me/avatar', auth, uploadProfile.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250 }).toBuffer();

    req.user.avatar = buffer;
    await req.user.save();

    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })

})

router.delete('/users/me/avatar', auth, uploadProfile.single('avatar'), async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();

    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })

})





module.exports = router;