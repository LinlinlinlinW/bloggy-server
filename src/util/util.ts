import consola from 'consola';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const MD5_SUFFIX = 'chuntonggao*&^%$#';

export const md5 = (pwd: crypto.BinaryLike): string => {
    const md5 = crypto.createHash('md5');
    return md5.update(pwd).digest('hex');
};

// format as 2018-12-12 12:12:00
export const timestampToTime = (timestamp: string | number | Date): string => {
    const date = new Date(timestamp);
    const Y = date.getFullYear() + '-';
    const M =
        (date.getMonth() + 1 < 10
            ? '0' + (date.getMonth() + 1)
            : date.getMonth() + 1) + '-';
    const D =
        date.getDate() < 10 ? '0' + date.getDate() + ' ' : date.getDate() + ' ';
    const h =
        date.getHours() < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';
    const m =
        date.getMinutes() < 10
            ? '0' + date.getMinutes() + ':'
            : date.getMinutes() + ':';
    const s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return Y + M + D + h + m + s;
};

export class ServerError extends Error {
    constructor({ message, statusCode }: { message: string; statusCode: number }) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
    statusCode: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFunc = (req: Request, res: Response, next: NextFunction) => Promise<any>;
type WrappedFunc = (req: Request, res: Response, next: NextFunction) => void;
export const tryAsync = (asyncFn: AsyncFunc): WrappedFunc => {
    return (req: Request, res: Response, next: NextFunction): void => {
        asyncFn(req, res, next).catch(err => {
            if (err instanceof ServerError) {
                res.status(err.statusCode).send({ message: err.message });
            } else {
                consola.error(err);
                res.status(500).send({
                    message: 'Your Internet connection is terrible! Please check!',
                });
            }
        });
    };
};
