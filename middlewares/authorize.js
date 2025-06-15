const authorizeUser=(permittedRoles)=>{
    return(req,res,next)=>{
        if(permittedRoles.includes(req.role)){
            next()
        }else{
            res.status(403).json({errors:"unauthorised  user"})
        }
    }
}
export default authorizeUser