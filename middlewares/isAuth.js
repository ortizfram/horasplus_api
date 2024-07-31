const jwt = require("jsonwebtoken");
const isAuthenticated = (req, res, next) => {
  const token =
    req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  try {
    jwt.verify(token, "anyKey", (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Not authenticated" });
  }
};

module.exports = isAuthenticated;
