import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Gauge, Plus, Minus, Trash2, X } from 'lucide-react'
import type { CircuitState, GateOperation, GateType } from '../../types/quantumLab'
import { GATE_CATALOG } from '../../types/quantumLab'
import { GatePalette } from './GatePalette'

interface CircuitBuilderProps {
  circuit: CircuitState
  width: number
  numQubits: number
  selectedGateId: string | null
  highlightedGateId: string | null
  onAddGate: (gate: GateType, targets: number[], column: number) => void
  onMoveGate: (id: string, targets: number[], column: number) => void
  onRemoveGate: (id: string) => void
  onSelectGate: (id: string | null) => void
  onAddQubit: () => void
  onRemoveQubit: () => void
  onReorderWires: (from: number, to: number) => void
  onClear: () => void
}

const CELL_W = 68
const LABEL_W = 96
const WIRE_H = 66
const COL_HDR_H = 30

export function CircuitBuilder({
  circuit,
  width,
  numQubits,
  selectedGateId,
  highlightedGateId,
  onAddGate,
  onMoveGate,
  onRemoveGate,
  onSelectGate,
  onAddQubit,
  onRemoveQubit,
  onReorderWires,
  onClear,
}: CircuitBuilderProps) {
  const [viewX, setViewX] = useState(0)
  const [viewY, setViewY] = useState(0)
  const [zoom, setZoom] = useState(1)
  const viewportRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
    pointerId: number
  } | null>(null)

  const moments = useMemo(() => Array.from({ length: Math.max(8, width) }, (_, i) => i), [width])
  const contentWidth = moments.length * CELL_W
  const contentHeight = numQubits * WIRE_H

  // ---- Panning ----
  const clampView = useCallback(
    (nx: number, ny: number) => {
      const vp = viewportRef.current
      if (!vp) return { x: nx, y: ny }
      const scaledW = (contentWidth + LABEL_W) * zoom
      const scaledH = contentHeight * zoom
      const maxX = Math.max(0, scaledW - vp.clientWidth)
      const maxY = Math.max(0, scaledH - vp.clientHeight)
      return {
        x: Math.min(0, Math.max(-maxX, nx)),
        y: Math.min(0, Math.max(-maxY, ny)),
      }
    },
    [contentWidth, contentHeight, zoom]
  )

  const handlePanStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (
        target.closest('.qlab-node') ||
        target.closest('.qlab-new-wire-label') ||
        target.closest('button')
      ) {
        return
      }
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: viewX,
        originY: viewY,
        pointerId: e.pointerId,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [viewX, viewY]
  )

  const handlePanMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pan = panRef.current
      if (!pan) return
      const next = clampView(pan.originX + (e.clientX - pan.startX), pan.originY + (e.clientY - pan.startY))
      setViewX(next.x)
      setViewY(next.y)
    },
    [clampView]
  )

  const handlePanEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId === e.pointerId) panRef.current = null
  }, [])

  // Zoom via native non-passive wheel listener to prevent window scrolling.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((z) => Math.min(2, Math.max(0.5, z - e.deltaY * 0.001)))
    }
    el.addEventListener('wheel', onWheelNative, { passive: false })
    return () => el.removeEventListener('wheel', onWheelNative)
  }, [])

  // ---- Drop a gate onto a wire slot ----
  const handleDrop = useCallback(
    (e: React.DragEvent, qubit: number, column: number) => {
      e.preventDefault()
      const makeTargets = (req: number): number[] | null => {
        if (qubit + req > numQubits) return null
        return Array.from({ length: req }, (_, i) => qubit + i)
      }

      // Moving an existing gate that was already placed on the builder.
      const moveRaw = e.dataTransfer.getData('application/x-quantum-gate-move')
      if (moveRaw) {
        try {
          const parsed = JSON.parse(moveRaw) as { id: string; qubits: number }
          const targets = makeTargets(parsed.qubits)
          if (targets) onMoveGate(parsed.id, targets, column)
        } catch {
          // ignore invalid payload
        }
        return
      }

      // Placing a fresh gate from the palette.
      const raw = e.dataTransfer.getData('application/x-quantum-gate')
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as {
          type: GateType
          qubits: number
        }
        const targets = makeTargets(parsed.qubits)
        if (targets) onAddGate(parsed.type, targets, column)
      } catch {
        // ignore invalid payload
      }
    },
    [numQubits, onAddGate, onMoveGate]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const types = Array.from(e.dataTransfer.types)
    e.dataTransfer.dropEffect = types.includes('application/x-quantum-gate-move')
      ? 'move'
      : 'copy'
  }, [])

  const getOpAt = useCallback(
    (qubit: number, moment: number): GateOperation | undefined =>
      circuit.operations.find(
        (op) => op.targets.includes(qubit) && op.moment === moment
      ),
    [circuit.operations]
  )

  // ---- Wire drag reorder ----
  const wireDragRef = useRef<number | null>(null)
  const handleWireDragStart = useCallback((e: React.DragEvent, idx: number) => {
    wireDragRef.current = idx
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-qubit-reorder', String(idx))
  }, [])
  const handleWireDrop = useCallback(
    (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/x-qubit-reorder')
      if (raw !== '') {
        const from = Number(raw)
        if (!Number.isNaN(from)) onReorderWires(from, targetIdx)
      }
      wireDragRef.current = null
    },
    [onReorderWires]
  )

  return (
    <div className="qlab-new-layout">
      {/* Gate palette — outside the canvas */}
      <div className="qlab-new-palette">
        <GatePalette />
      </div>

      <div className="qlab-new-builder">
        {/* Pannable canvas */}
        <div
          ref={viewportRef}
          className="qlab-new-viewport"
          onPointerDown={handlePanStart}
          onPointerMove={handlePanMove}
          onPointerUp={handlePanEnd}
          onPointerCancel={handlePanEnd}
        >
        <div
          className="qlab-new-canvas"
          style={{
            transform: `translate(${viewX}px, ${viewY}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: contentWidth + LABEL_W,
            minWidth: contentWidth + LABEL_W,
          }}
        >
          {/* Column header */}
          <div className="qlab-new-rows" style={{ marginLeft: LABEL_W }}>
            {moments.map((m) => (
              <div key={m} className="qlab-new-col-label">
                {m}
              </div>
            ))}
          </div>

          {/* Wires */}
          {Array.from({ length: numQubits }, (_, qIdx) => (
            <div
              key={qIdx}
              className="qlab-new-wire"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleWireDrop(e, qIdx)}
            >
              <div
                className="qlab-new-wire-label"
                draggable
                onDragStart={(e) => handleWireDragStart(e, qIdx)}
                onDragEnd={() => (wireDragRef.current = null)}
                title="Drag to reorder wire"
              >
                <span className="qlab-new-qubit-name">q{qIdx}</span>
                <span className="qlab-new-qubit-state">|0⟩</span>
              </div>
              <div className="qlab-new-wire-track" />
              <div className="qlab-new-wire-cells">
                {moments.map((mIdx) => {
                  const op = getOpAt(qIdx, mIdx)
                  return (
                    <div
                      key={mIdx}
                      className="qlab-new-cell"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, qIdx, mIdx)}
                      onClick={() => (op ? onSelectGate(op.id) : onSelectGate(null))}
                    >
                      {op && (
                        <GateNode
                          op={op}
                          qubitIndex={qIdx}
                          isSelected={selectedGateId === op.id}
                          isHighlighted={highlightedGateId === op.id}
                          onSelect={() => onSelectGate(op.id)}
                          onDelete={() => onRemoveGate(op.id)}
                        />
                      )}                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Connection lines for multi-qubit gates */}
          {circuit.operations
            .filter((op) => op.targets.length > 1)
            .map((op) => (
              <ConnectorLine
                key={`conn-${op.id}`}
                op={op}
                selected={selectedGateId === op.id}
              />
            ))}
        </div>
      </div>

      {/* Fixed bottom bar (add qubit / clear) */}
      <div className="qlab-new-addbar">
        <div className="qlab-new-addbar-left">
          <button
            type="button"
            className="qlab-new-btn qlab-new-btn-sm"
            onClick={onAddQubit}
            disabled={numQubits >= 8}
            title="Add qubit wire"
          >
            <Plus size={12} />
            <span>Add Qubit</span>
          </button>
          <button
            type="button"
            className="qlab-new-btn qlab-new-btn-sm"
            onClick={onRemoveQubit}
            disabled={numQubits <= 1}
            title="Remove last qubit wire"
          >
            <Minus size={12} />
            <span>Remove Qubit</span>
          </button>
          <button
            type="button"
            className="qlab-new-btn qlab-new-btn-sm qlab-new-btn-danger"
            onClick={onClear}
            disabled={circuit.operations.length === 0}
            title="Clear all gates"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
        <div className="qlab-new-addbar-right">
          <span className="qlab-new-qubits-count">
            {numQubits} qubit{numQubits > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      </div>
    </div>
  )
}

function gateRole(op: GateOperation, qIdx: number): 'box' | 'dot' | 'oplus' | 'swap' | 'measure' {
  if (op.gate === 'M') return 'measure'
  if (op.targets.length === 1) return 'box'
  switch (op.gate) {
    case 'CNOT':
      return qIdx === op.targets[0] ? 'dot' : 'oplus'
    case 'CCX':
      return qIdx === op.targets[0] || qIdx === op.targets[1] ? 'dot' : 'oplus'
    case 'CZ':
    case 'CCZ':
      return 'dot'
    case 'CSWAP':
    case 'SWAP':
      return 'swap'
    default:
      return 'box'
  }
}

function GateNode({
  op,
  qubitIndex,
  isSelected,
  isHighlighted,
  onSelect,
  onDelete,
}: {
  op: GateOperation
  qubitIndex: number
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const definition = GATE_CATALOG.find((g) => g.type === op.gate)
  const role = gateRole(op, qubitIndex)
  const isFirst = String(op.targets[0]) === String(qubitIndex) ||
    (op.gate === 'M')

  const classes = [
    'qlab-node',
    `qlab-node-${role}`,
    role === 'box' || role === 'measure' ? 'qlab-node-box' : '',
    isSelected ? 'is-selected' : '',
    isHighlighted ? 'is-highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.setData(
      'application/x-quantum-gate-move',
      JSON.stringify({ id: op.id, type: op.gate, qubits: op.targets.length })
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  const content = (() => {
    switch (role) {
      case 'measure':
        return <Gauge size={16} />
      case 'dot':
        return <span className="qlab-node-dot" />
      case 'oplus':
        return <span className="qlab-node-plus">⊕</span>
      case 'swap':
        return <span className="qlab-node-swap">✕</span>
      default:
        return <span>{definition?.symbol ?? op.gate}</span>
    }
  })()

  return (
    <div
      className={classes}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      title={`${definition?.name ?? op.gate} ${op.targets.length > 1 ? `[${op.targets.join(',')}]` : ''}`}
    >
      {content}
      {isSelected && (isFirst || op.targets.length === 1) && (
        <button
          type="button"
          className="qlab-node-delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Remove gate"
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}

function ConnectorLine({
  op,
  selected,
}: {
  op: GateOperation
  selected: boolean
}) {
  const [min, max] = [Math.min(...op.targets), Math.max(...op.targets)]
  const top = COL_HDR_H + min * WIRE_H + WIRE_H / 2
  const height = (max - min) * WIRE_H
  const left = LABEL_W + op.moment * CELL_W + CELL_W / 2

  return (
    <div
      className={`qlab-connector ${selected ? 'is-selected' : ''}`}
      style={{ top: `${top}px`, left: `${left}px`, height: `${height}px` }}
    />
  )
}
