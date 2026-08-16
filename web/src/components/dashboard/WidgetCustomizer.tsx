import { useRef, useEffect } from 'react'
import { Settings, Eye, EyeOff } from 'lucide-react'
import type { WidgetConfig } from '../../types/dashboard'

interface Props {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  config: WidgetConfig[]
  onConfigChange: (newConfig: WidgetConfig[]) => void
}

export default function WidgetCustomizer({ isOpen, setIsOpen, config, onConfigChange }: Props) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  const toggleWidget = (id: string) => {
    const newConfig = config.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    onConfigChange(newConfig)
  }

  return (
    <div className="widget-customizer-wrapper">
      <button 
        className={`btn-icon ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Customize Dashboard"
      >
        <Settings size={15} color={isOpen ? 'var(--color-accent)' : 'var(--color-muted)'} />
      </button>

      {isOpen && (
        <div className="widget-customizer-popup" ref={popupRef}>
          <div className="popup-header">
            <h4>Customize Dashboard</h4>
            <p>Show or hide widgets</p>
          </div>
          <div className="widget-list">
            {config.map(w => (
              <div 
                key={w.id} 
                className={`widget-toggle-item ${w.visible ? 'visible' : 'hidden'}`}
                onClick={() => toggleWidget(w.id)}
              >
                <span>{w.label}</span>
                {w.visible ? <Eye size={14} color="var(--color-accent)" /> : <EyeOff size={14} color="var(--color-muted)" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
