export const parsers = {
    'date': (d:string)=>new Date(d),
    'metadata': (md:string, version: string)=>{
        
    },
    'bufferToStrFromB64': (str:Buffer)=>str.toString('base64')
}

