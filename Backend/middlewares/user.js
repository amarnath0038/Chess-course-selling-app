const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");

function userMiddleware (req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    res.status(401).json({ message : "No token provided" });
    return
  }

  try {
    const decodedInfo = jwt.verify(token, JWT_USER_PASSWORD);
    req.userId = decodedInfo.id;
    next();
  } catch(error) {
    res.status(401).json({ message : "You are not signed in" });
  }
}


module.exports = { userMiddleware };