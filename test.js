const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/ai-interview-platform').then(async () => {
    const userSchema = new mongoose.Schema({
        name: String,
        email: String,
        password: String
    });
    userSchema.pre("save", async function (next) {
        if (!this.isModified("password")) {
            return next();
        }
        try {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    try {
        await User.create({ name: 'Test', email: 'test3@test.com', password: 'password' });
        console.log("Success");
    } catch (e) {
        console.error("CREATE ERROR:", e);
    }
    process.exit(0);
});
