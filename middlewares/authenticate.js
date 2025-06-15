import jwt from "jsonwebtoken"

export default function authenticateUser(req,res,next){
    const token=req.headers['authorization']
    if(!token){
        return res.status(401).json({errors:"token is required"})
    }try{
    const tokenData=jwt.verify(token,process.env.SECRET)
    
req.userId=tokenData.userId;
req.role=tokenData.role;
console.log("Authorization header:", req.headers['authorization']);

console.log({tokenData})
next()
}catch(err){
    return res.status(401).json({errors:err.message})
}
}

