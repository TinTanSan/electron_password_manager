
import {parsers} from '../parsers'

test('base64Buff turns base 64 strings into normal buffers', ()=>{
    const testStr = "hello";
    const base64Encoded = Buffer.from(testStr).toString('base64');
    const result = parsers.b64Buff(base64Encoded);
    expect(result.toString()).toBe(testStr);
})
