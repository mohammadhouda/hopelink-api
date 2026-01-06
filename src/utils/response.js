export function success(res, data = null, message = "Success", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

export function failure(res, message = "Something went wrong", status = 500) {
  return res.status(status).json({
    success: false,
    message
  });
}
