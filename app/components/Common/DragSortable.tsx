'use client'

import type { CSSProperties, ReactNode } from 'react'
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * 목적 카드·적립 항목 공용 드래그 정렬 감도.
 * - 마우스(웹): 150ms 눌러야 시작 → 클릭/탭 이동과 구분(웹 개발 검증용).
 * - 터치(모바일): 220ms 롱프레스로 "집어 든다". 그 안에 8px 이상 움직이면
 *   스와이프/스크롤로 보고 드래그를 시작하지 않는다(카드 헤더 탭·행 스와이프 삭제와 공존).
 */
export function useReorderSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )
}

type SortableState = ReturnType<typeof useSortable>

export interface SortableRenderProps {
  setNodeRef: SortableState['setNodeRef']
  style: CSSProperties
  isDragging: boolean
  /** 드래그 손잡이(=롱프레스로 집는 지점)에 스프레드할 props. */
  handle: {
    ref: SortableState['setActivatorNodeRef']
    attributes: SortableState['attributes']
    listeners: SortableState['listeners']
  }
}

/**
 * 정렬 가능한 1개 항목. render-prop으로 노드 ref·transform 스타일·드래그 손잡이 props를 넘긴다.
 * 손잡이(listeners)를 항목 전체가 아니라 특정 영역(카드 헤더 / 행 본문)에만 붙여,
 * 그 지점의 롱프레스로만 드래그가 시작되게 한다.
 */
export function Sortable({
  id,
  disabled,
  children,
}: {
  id: string
  disabled?: boolean
  children: (props: SortableRenderProps) => ReactNode
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  }

  return children({
    setNodeRef,
    style,
    isDragging,
    handle: { ref: setActivatorNodeRef, attributes, listeners },
  })
}
