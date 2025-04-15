const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = {
    // Registration endpoint
    create: async function (req, res) {
        try {
            let { username, password, email } = req.body;
            username = username.trim()
    
            if (!username) {
                return res.badRequest({ error: 'Username is required.' });
            }

            if (username.length < 6 || username.length > 20) {
                return res.badRequest({ error: 'Username must be 6 to 20 characters.' });
            }
    
            const usernameRegex = /^[a-zA-Z0-9_]{6,20}$/;
            if (!usernameRegex.test(username)) {
                return res.badRequest({ error: 'Username can contain alphabet, numeric, and _ only.' });
            }

            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.badRequest({ error: 'Username is already taken.' });
            }
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.badRequest({ error: 'Email address is already taken.' });
            }

            if (!password || password.length < 8) {
                return res.badRequest({ error: 'Password must be at least 8 characters long.' });
            }

            const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.badRequest({ error: 'Password must contain at least one number and one alphabetic character.' });
            }
            const newUser = await User.create({ username, password, email }).fetch();

            // Generate access token and refresh token
            const accessToken = jwt.sign({ id: newUser.user_id }, process.env.JWT_SECRET, { expiresIn: '30m' });
            const refreshToken = jwt.sign({ id: newUser.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                user_id: newUser.user_id,
                email: newUser.email,
                type: newUser.type,
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        } catch (error) {
            return res.serverError(error);
        }
    },

    // Sign in endpoint
    login: async function (req, res) {
        try {
            const { email, password } = req.body;
        
            const user = await User.findOne({ email });
            const isPasswordValid = await bcrypt.compare(password, user.password);
        
            if (!user || !isPasswordValid) {
                return res.badRequest({ error: 'Incorrect email or password.' });
            }
        
            // Generate access token and refresh token
            const accessToken = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '30m' });
            const refreshToken = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
            return res.json({
                user_id: user.user_id,
                email: user.email,
                type: user.type,
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        } catch (error) {
            return res.serverError(error);
        }
    },

    // Get all users
    findAll: async function (req, res) {
        try {
            await sails.helpers.auth.checkAdmin.with({ req }).intercept((err) => {
                return res.badRequest({ error: 'Unauthorized. Not an admin or user not found.' });
            });
            const usersFromDb = await User.find()
            const users = _.map(usersFromDb, user => _.omit(user, ['password']));

            return res.json({ users });
        } catch (error) {
            return res.serverError(error);
        }
    }
      
}
