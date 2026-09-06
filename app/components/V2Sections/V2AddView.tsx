'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import V2MoneyField from './V2MoneyField'
import { shortWon } from '@/app/utils/goal-format'

export interface V2AddViewProps {
  name: string
  amount: number
  plan: number
  /** 이 항목까지 담았을 때 계획에서 남는 금액 */
  remainingAfter: number
  canSubmit: boolean
  onNameChange: (value: string) => void
  onAmountChange: (value: number) => void
  onSubmit: () => void
  onBack: () => void
}

/**
 * 적립 항목 담기 — 은행 적금 상세 페이지식으로 위에서 아래로 읽으며 채운다.
 *
 * 필수는 이름·금액·주기·시작 시점 4개이고 만기일은 묻지 않는다(N-18, 브리프 §6).
 * 답한 만큼만 아래가 열린다. 입력 단위는 '원' 하나다 — ETF를 MVP에서 뺐다.
 *
 * 숫자 상한이 1이라 브리프 §6의 `1억까지 +N%`와 계획 채움 중 하나만 둘 수 있어
 * 계획 채움을 남겼다(06-constraints §5-1).
 */
export default function V2AddView({
  name,
  amount,
  plan,
  remainingAfter,
  canSubmit,
  onNameChange,
  onAmountChange,
  onSubmit,
  onBack,
}: V2AddViewProps) {
  return (
    <SubPageScaffold onBack={onBack} contentClassName="flex flex-col gap-3 py-2">
      <h1 className="pb-2 text-title font-bold">적립 항목 담기</h1>

      <Card className="px-4 py-1">
        <div className="flex flex-col gap-2 py-4">
          <label htmlFor="v2-add-name" className="text-caption text-muted-foreground">
            무엇을 모으고 있나요
          </label>
          <input
            id="v2-add-name"
            value={name}
            placeholder="청년적금"
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full bg-transparent text-heading font-bold text-foreground outline-none placeholder:font-normal placeholder:text-placeholder"
          />
        </div>

        {name.trim() && (
          <div className="border-t border-border-subtle">
            <V2MoneyField
              id="v2-add-amount"
              label="얼마씩"
              value={amount}
              onChange={onAmountChange}
              presets={[100_000, 300_000, 500_000]}
              presetLabel={shortWon}
            />
          </div>
        )}

        {amount > 0 && (
          <>
            <div className="flex flex-col gap-2 border-t border-border-subtle py-4">
              <span className="text-caption text-muted-foreground">언제마다</span>
              <span className="text-label font-medium">매달</span>
            </div>
            <div className="flex flex-col gap-2 border-t border-border-subtle py-4">
              <span className="text-caption text-muted-foreground">언제부터</span>
              <span className="text-label font-medium">이번 달부터</span>
            </div>
          </>
        )}
      </Card>

      {amount > 0 && (
        <Card className="p-4">
          <p className="text-caption tabular-nums text-muted-foreground">
            {remainingAfter > 0 ? (
              <>
                매달 {shortWon(plan)} 중 {shortWon(plan - remainingAfter)} 채움 ·{' '}
                <span className="font-bold text-foreground">{shortWon(remainingAfter)} 남음</span>
              </>
            ) : (
              <>
                매달 {shortWon(plan)}, <span className="font-bold text-foreground">다 채웠어요</span>
              </>
            )}
          </p>
        </Card>
      )}

      <Button className="mt-4 h-12 w-full text-body font-bold" disabled={!canSubmit} onClick={onSubmit}>
        담기
      </Button>
    </SubPageScaffold>
  )
}
