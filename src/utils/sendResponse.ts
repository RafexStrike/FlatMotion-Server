// File: src/utils/sendResponse.ts
import { Response } from 'express';

interface SendResponseData<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
}

const sendResponse = <T>(res: Response, data: SendResponseData<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data || null,
  });
};

export default sendResponse;
