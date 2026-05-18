import { useEffect, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'motion/react'
import { IoCheckmarkCircleOutline } from 'react-icons/io5'

export default function AuthTips({ tips = [], intervalMs = 6000, kicker = 'Why LavenderCare Labs?', className = 'lc-auth-tips-inner' }) {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [tips.length, intervalMs])

  return (
    <div className={className}>
      <div className="lc-auth-tips-kicker">{kicker}</div>
      <AnimatePresence mode="wait">
        <Motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="lc-auth-tip"
        >
          <div className="lc-auth-tip-title">{tips[tipIndex]?.title}</div>
          <div className="lc-auth-tip-text">{tips[tipIndex]?.text}</div>
          {Array.isArray(tips[tipIndex]?.bullets) && tips[tipIndex]?.bullets.length > 0 && (
            <ul className="lc-auth-tip-list">
              {tips[tipIndex].bullets.map((item, idx) => (
                <li key={idx} className="lc-auth-tip-list-item">
                  <span className="lc-auth-tip-list-icon">
                    <IoCheckmarkCircleOutline />
                  </span>
                  <span className="lc-auth-tip-list-text">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Motion.div>
      </AnimatePresence>
      <div className="lc-auth-dots" aria-hidden="true">
        {tips.map((_, i) => (
          <span key={i} className={i === tipIndex ? 'lc-auth-dot lc-auth-dot--active' : 'lc-auth-dot'} />
        ))}
      </div>
    </div>
  )
}
