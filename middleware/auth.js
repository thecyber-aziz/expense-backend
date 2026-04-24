import jwt from 'jsonwebtoken';

// Enhanced token validation middleware
export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - no token provided',
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user ID to request object
    req.user = { id: decoded.id };
    
    console.log(`✅ Token verified for user: ${decoded.id}`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired - please login again',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - authentication failed',
        code: 'INVALID_TOKEN',
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'AUTH_ERROR',
    });
  }
};

// Optional: Logout route middleware
export const logout = async (req, res, next) => {
  try {
    // Client-side token removal is handled by frontend
    // Backend just confirms logout
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Logout failed',
    });
  }
};
