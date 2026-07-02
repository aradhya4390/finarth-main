import jwt from 'jsonwebtoken'

// Auth middleware supports an environment override for local development.
// If `ALLOW_DEV_AUTH` is set to "true" (string), the middleware will bypass JWT
// verification and allow requests through. THIS IS FOR DEVELOPMENT ONLY.
// Do NOT enable in production.
export default function authMiddleware(req,res,next){
  try{
    if(process.env.ALLOW_DEV_AUTH === 'true'){
      // Development bypass allowed, but restrict bypass to specific routes only.
      // Bypass only for file upload and analytics dashboard routes.
      const path = req.path || ''
      const method = (req.method || '').toUpperCase()
      const allowPaths = [
        // POST /api/analysis (file upload)
        '/api/analysis',
        // GET /api/analytics/dashboard
        '/api/analytics/dashboard',
        // GET /api/analysis/analytics
        '/api/analysis/analytics'
      ]
      const shouldBypass = allowPaths.some(p => path.startsWith(p))
      if(shouldBypass){
        console.warn('ALLOW_DEV_AUTH is enabled — bypassing JWT on dev-only routes:', path)
        req.userId = null
        return next()
      }
      // For other routes (including /api/auth/*) continue with normal auth enforcement.
    }

    const auth = req.headers.authorization
    if(!auth) return res.status(401).json({ message:'Not authenticated' })
    const token = auth.split(' ')[1]
    try{
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = payload.id
      next()
    }catch(e){ res.status(401).json({ message:'Invalid token' }) }
  }catch(e){
    // Fallback: deny
    return res.status(401).json({ message: 'Authentication error' })
  }
}
