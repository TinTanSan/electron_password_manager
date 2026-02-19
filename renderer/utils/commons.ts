
import { Entry } from "../interfaces/Entry";

export function isStrongPassword(password:string):string{
    let passwordMessage = []
    if (password.length <8){
        passwordMessage.push("must be atleast 8 characters in length");
    }
    if (password.match(/[A-Z]+/g) === null){
        passwordMessage.push( "must contain an upper case letter");
    }
    if (password.match(/[0-9]+/g) === null){
        passwordMessage.push("must contain at least 1 number");
    }
    if (password.match(/[^\w\s]/g) === null){
        passwordMessage.push("must contain a special character");
    }
    return passwordMessage.length > 0? "The password "+passwordMessage.join(", ") : "";
}

function cmpObj(left:any, right:any){
    for (let k in left){
        // recurse
        if (typeof left[k] === 'object' && right[k]){
            cmpObj(left[k], right[k])
        }
        if (right[k] === undefined || right[k] !== left[k]){
            return false;
        }
    }
    
    return true;
}

export function cmpEntry(left:Entry, right:Entry){
    for (let key in left){
        if (!(key in right)) return false;
        if (typeof left[key] === "object"){
            if (!cmpObj(left[key], right[key]))return false
        }
        if (right[key] !== left[key]) return false
    }
    return true;

    // return isDeepStrictEqual(left, right)
}

export const lowerCaseLetters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
export const upperCaseLetters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
export const digits = ["0","1","2","3","4","5","6","7","8","9"];
export const asciiSafeSpecialChars = ["!","\"","#","$","%","&","'","(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"];