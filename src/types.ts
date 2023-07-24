// types.ts
import { Request } from 'express';

interface CustomRequest extends Request {
    decodedUserEmail?: string;
}

export default CustomRequest;
