'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import V2TabScaffold from './V2TabScaffold'
import { shortWon } from '@/app/utils/goal-format'

export interface V2SettingsViewProps {
  startBalance: number
  onReset: () => void
}

const LINKS = [
  ['알림', '켬'],
  ['테마', '시스템'],
  ['토리 이야기', ''],
  ['자주 묻는 질문', ''],
  ['계정', ''],
] as const

/**
 * 설정 — 요소 예산: 블록 6 · 숫자 2 · primary 0.
 * 서랍('고급 설정')을 만들지 않는다(N-17). 브랜드 스토리 진입은 여기에만 둔다.
 */
export default function V2SettingsView({ startBalance, onReset }: V2SettingsViewProps) {
  return (
    <V2TabScaffold current="settings">
      <h1 className="py-4 text-title font-bold">설정</h1>

      <Card className="px-4">
        <Row label="목표 금액" value="1억원" />
        <Row label="시작 잔액" value={shortWon(startBalance)} bordered />
      </Card>

      <Card className="px-4">
        {LINKS.map(([label, value], index) => (
          <Row key={label} label={label} value={value || '›'} bordered={index > 0} />
        ))}
      </Card>

      <div className="mt-4 flex flex-col gap-2">
        <p className="text-caption text-muted-foreground">
          프로토타입입니다. 값은 이 브라우저에만 저장되고 서버로 가지 않습니다.
        </p>
        <Button variant="outline" onClick={onReset} className="w-full">
          처음부터 다시
        </Button>
      </div>
    </V2TabScaffold>
  )
}

function Row({ label, value, bordered }: { label: string; value: string; bordered?: boolean }) {
  return (
    <div
      className={
        'flex items-center justify-between gap-3 py-4' +
        (bordered ? ' border-t border-border-subtle' : '')
      }
    >
      <span className="text-label">{label}</span>
      <span className="text-caption tabular-nums text-muted-foreground">{value}</span>
    </div>
  )
}
