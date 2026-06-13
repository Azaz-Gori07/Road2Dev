export const success = (res, { data = null, message = 'OK', status = 200 } = {}) => {
  return res.status(status).json({ success: true, message, data, error: null });
};

export const error = (res, { message = 'Internal server error', status = 500, error = null } = {}) => {
  return res.status(status).json({ success: false, message, data: null, error: error || message });
};
