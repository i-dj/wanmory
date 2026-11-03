import { Minus, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'

// ZoomSlider：− 滑块 +，调照片大小（大约每行几张），每点一次变一档。往 + 是照片变大（每行张数变少）。
export default function ZoomSlider({
  columns,
  min,
  max,
  onChange,
  onStep,
}: {
  columns: number
  min: number
  max: number
  onChange: (columns: number) => void
  onStep: (delta: number) => void // +1 多一列（格子变小）
}) {
  // 滑块左边走过的部分是亮色，右边是暗色（样式在 index.css 的 .zoom-range）
  const filled = max > min ? ((max - columns) / (max - min)) * 100 : 100
  return (
    <div className="flex items-center gap-2">
      <StepButton label="缩小" disabled={columns >= max} onClick={() => onStep(1)}>
        <Minus className="size-4" />
      </StepButton>
      <input
        type="range"
        // 滑块从左到右是格子从小到大，对应列数从多到少，所以取反
        min={-max}
        max={-min}
        step={1}
        value={-columns}
        onChange={(e) => onChange(-Number(e.target.value))}
        aria-label={`照片大小：大约每行 ${columns} 张`}
        className="zoom-range w-24 sm:w-28"
        style={{ '--filled': `${filled}%` } as CSSProperties}
      />
      <StepButton label="放大" disabled={columns <= min} onClick={() => onStep(-1)}>
        <Plus className="size-4" />
      </StepButton>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-0.5 text-fg/80 hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  )
}
