let authRequest = (req, res, next) => {
    if(req.headers['auth-key'] && req.headers['auth-key'] === process.env.AUTH_KEY) {
        next();
    }
    else {
        next('Auth headers missing or invalid');
    }
}
export { authRequest }