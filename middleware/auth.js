const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

//protect routes
exports.protect = async (req,res,next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    //make sure token exists
    if(!token || token == 'null') {
        return res.status(401).json({success:false, message:"not authorize to access this route"});
    }

    try {
        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log(decoded);

        req.user=await User.findById(decoded.id);

        next();
    } catch(err) {
        console.log(err.stack);
        return res.status(401).json({success:false, message:"not authorize to access this route"});
    }
};

//grant access to specific roles
exports.authorize=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)) {
            return res.status(403).json({
                success:false,
                message:`user role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    }
}