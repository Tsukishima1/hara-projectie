import { AppwriteException } from "node-appwrite";
  
export const ErrorHandler = (error: unknown) => {
    if (error instanceof AppwriteException) {
      return { success: false, message: error.message, statusCode: error.code };
    }
  
    // 处理其他未知错误
    console.error("Unexpected error:", error);
    return { success: false, message: "An unexpected error occurred", statusCode: 500 };
};