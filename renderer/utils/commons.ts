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