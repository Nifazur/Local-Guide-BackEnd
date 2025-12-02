import { IPaginationMeta } from '../types';

interface IApiResponseData<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    pagination?: IPaginationMeta;
  };
}

// Factory functions instead of class with static methods
export const createResponse = <T>(
  statusCode: number,
  message: string,
  data?: T,
  meta?: { pagination?: IPaginationMeta }
): IApiResponseData<T> => {
  const response: IApiResponseData<T> = {
    success: statusCode < 400,
    statusCode,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta !== undefined) {
    response.meta = meta;
  }

  return response;
};

export const successResponse = <T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): IApiResponseData<T> => {
  return createResponse(statusCode, message, data);
};

export const createdResponse = <T>(
  data: T,
  message: string = 'Created successfully'
): IApiResponseData<T> => {
  return createResponse(201, message, data);
};

export const paginatedResponse = <T>(
  data: T,
  pagination: IPaginationMeta,
  message: string = 'Success'
): IApiResponseData<T> => {
  return createResponse(200, message, data, { pagination });
};

export const noContentResponse = (
  message: string = 'Deleted successfully'
): IApiResponseData<null> => {
  return createResponse(200, message, null);
};

// Default export as object with methods
const ApiResponse = {
  success: successResponse,
  created: createdResponse,
  paginated: paginatedResponse,
  noContent: noContentResponse,
};

export default ApiResponse;