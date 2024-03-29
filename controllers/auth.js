// controllers/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const app = express();
const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }));
const SecretKey = "2809a95eedde5863d8e8e3bea5205cd62d290b10a3769afee677b8754a4d05b7";

router.post("/login", async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const user = await User.findOne({ mobile });

        if (!user) {
            const message = "Wrong mobile number";
            return res.json({ message });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            const message = "Wrong password";
            return res.json({ message });
        }

        const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
        const token = jwt.sign({ userId: user._id }, SecretKey, { expiresIn });
        res.json({ token, isAdmin: user.isAdmin, expiresIn });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

