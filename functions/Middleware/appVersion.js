const functions = require("firebase-functions")

function checkAppVersion(req, res, next) {

    if (req.header("appVersion") !== "0.5.5") {
        functions.logger.error("Outdated App Version")
        res.status(401)
        return next("Outdated")
    }
    next()
}
module.exports = {
    checkAppVersion: checkAppVersion
}