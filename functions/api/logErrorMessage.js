import { error } from "firebase-functions/logger";

function logErrorAndRespond(
  returnMessage,
  res,
  next,
  statusCode,
  errorContent
) {
  error(returnMessage);
  if (errorContent) {
    error(JSON.stringify(errorContent));
  }
  if (res && next && statusCode) {
    res.status(statusCode);
    next(returnMessage);
  }
}

export default logErrorAndRespond;
