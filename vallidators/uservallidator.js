import User from "../models/usermodel.js"
export const userregisterSchema={
   
    email:{
        exists:{
            errorMessage:'email fiels is required'
        },
        notEmpty:{
    errorMessage:'email should not be empty'
        },
    isEmail:{
        errorMessage:'email should be valid format'
    },
    trim:true,
    normalizeEmail:true,
    custom:{
        options:async function (value) {
           try{
    const user=await User.findOne({email:value})
            if(user){
                throw new Error('email already taken!!')
            }
        }catch(err){
      throw new  Error(err.message)
        }
        return true
        }
    }
    },
    password:{
        exists:{
            errorMessage:'password cannot be empty'
            
        },
          notEmpty:{
            errorMessage:'pasword cannot be empty'
    
          },
          isStrongPassword:{
    options:{
                minlength:8,
                minLowercase:1,
                minUppercase:1,
                minNumber:1,
                minSymbol:1
            },
        errorMessage:'passwors must constain one loweracase, one uppercase,one symbol,one number,and it must constail8 characters long' 
        },
        trim:true
    }
    
    }
    export const userloginSchema={
        
        email:{
            exists:{
                errorMessage:'email fiels is required'
            },
            notEmpty:{
        errorMessage:'email should not be empty'
            },
        isEmail:{
            errorMessage:'email should be valid format'
        },
        trim: true,
           normalizeEmail: true,
           custom:{
        options:async function (value) {
           try{
                 const user=await User.findOne({email:value})
            if(!user){
                throw new Error('email is not registered')
            }
        }catch(err){
                throw new  Error(err.message)
        }
        return true
        }
           }
        
        },
        password:{
            exists:{
                errorMessage:'password cannot be empty'
                
            },
              notEmpty:{
                errorMessage:'pasword cannot be empty'
        
              },
              isStrongPassword:{
        options:{
                    minlength:8,
                    minLowercase:1,
                    minUppercase:1,
                    minNumber:1,
                    minSymbol:1
                },
            errorMessage:'passwors must constain one loweracase, one uppercase,one symbol,one number,and it must constail8 characters long' 
            },
            trim:true
        }
        
        }