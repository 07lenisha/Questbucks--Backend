import mongoose from 'mongoose'
const configureDb=async()=>{
    try{
        const db=await mongoose .connect(process.env.URL)
        console.log("connected to db")
    }catch(err){
    console.log("error connecting to db")

    }

}
export default configureDb

