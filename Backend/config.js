const JWT_ADMIN_PASSWORD = process.env.JWT_ADMIN_PASSWORD; // access JWT secret for admin auth
const JWT_USER_PASSWORD = process.env.JWT_USER_PASSWORD;

module.exports = { JWT_ADMIN_PASSWORD, JWT_USER_PASSWORD };