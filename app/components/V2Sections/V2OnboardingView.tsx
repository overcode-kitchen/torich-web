'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import SubPageScaffold from '@/app/components/SubPageScaffold'
import V2MoneyField from './V2MoneyField'
import { shortWon } from '@/app/utils/goal-format'
import type { V2OnboardingStep } from '@/app/hooks/v2/useV2Onboarding'
import { cn } from '@/lib/utils'

export interface V2OnboardingViewProps {
  step: V2OnboardingStep
  startBalance: number
  monthlyPlan: number
  payday: number
  onBack: () => void
  onChooseExisting: () => void
  onChooseNew: () => void
  onStartBalanceChange: (value: number) => void
  onMonthlyPlanChange: (value: number) => void
  onPaydayChange: (value: number) => void
  onGoToPlan: () => void
  onComplete: () => void
}

const PAYDAYS = [5, 15, 25]

/** 한 스텝에 질문 하나. 갈라지는 것은 온보딩뿐이다(브리프 §4). */
export default function V2OnboardingView(props: V2OnboardingViewProps) {
  const { step, onBack } = props

  return (
    <SubPageScaffold onBack={onBack} contentClassName="flex flex-col gap-2 py-2">
      {step === 'branch' && <BranchStep {...props} />}
      {step === 'balance' && <BalanceStep {...props} />}
      {step === 'plan' && <PlanStep {...props} />}
    </SubPageScaffold>
  )
}

function StepHeading({ title, help }: { title: string; help: string }) {
  return (
    <div className="flex flex-col gap-2 pb-4">
      <h1 className="text-balance text-title font-bold leading-snug">{title}</h1>
      <p className="whitespace-pre-line text-label leading-relaxed text-muted-foreground">{help}</p>
    </div>
  )
}

function BranchStep({ onChooseExisting, onChooseNew }: V2OnboardingViewProps) {
  return (
    <>
      <StepHeading title="1억, 같이 모아볼까요" help={'먼저 한 가지만 물어볼게요.\n지금 어디쯤 계신가요?'} />
      <div className="flex flex-col gap-3">
        {[
          { onClick: onChooseExisting, title: '이미 모으고 있어요', desc: '적금·주식·현금 어딘가에 모아둔 게 있어요' },
          { onClick: onChooseNew, title: '이제 시작하려고요', desc: '아직 모아둔 건 없어요' },
        ].map(({ onClick, title, desc }) => (
          <button key={title} type="button" onClick={onClick} className="text-left">
            <Card className="flex flex-col gap-1 p-4 transition-colors hover:border-brand-accent-border">
              <span className="text-body font-bold">{title}</span>
              <span className="text-caption text-muted-foreground">{desc}</span>
            </Card>
          </button>
        ))}
      </div>
    </>
  )
}

function BalanceStep({ startBalance, onStartBalanceChange, onGoToPlan }: V2OnboardingViewProps) {
  return (
    <>
      <StepHeading
        title="지금까지 얼마나 모으셨어요?"
        help={'대략만 적어도 됩니다.\n나중에 설정에서 고칠 수 있어요.'}
      />
      <Card className="px-4 py-1">
        <V2MoneyField
          id="v2-start-balance"
          label="모아둔 돈"
          value={startBalance}
          onChange={onStartBalanceChange}
          presets={[10_000_000, 24_000_000, 50_000_000]}
          presetLabel={shortWon}
          autoFocus
        />
      </Card>
      <Button className="mt-4 h-12 w-full text-body font-bold" onClick={onGoToPlan}>
        다음
      </Button>
    </>
  )
}

function PlanStep({
  monthlyPlan,
  payday,
  onMonthlyPlanChange,
  onPaydayChange,
  onComplete,
}: V2OnboardingViewProps) {
  return (
    <>
      <StepHeading
        title="매달 얼마나 모을 수 있어요?"
        help={'지키지 못해도 괜찮아요.\n언제 도착하는지 알려드리려고 묻는 거예요.'}
      />
      <Card className="px-4 py-1">
        <V2MoneyField
          id="v2-monthly-plan"
          label="매달"
          value={monthlyPlan}
          onChange={onMonthlyPlanChange}
          presets={[300_000, 500_000, 1_000_000]}
          presetLabel={shortWon}
          autoFocus
        />
        <div className="flex flex-col gap-2 border-t border-border-subtle py-4">
          <span className="text-caption text-muted-foreground">며칠에</span>
          <div className="flex flex-wrap gap-2">
            {PAYDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => onPaydayChange(day)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-caption transition-colors',
                  day === payday
                    ? 'bg-brand-accent-bg font-bold text-brand-accent-text'
                    : 'bg-surface text-muted-foreground',
                )}
              >
                {day}일
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Button className="mt-4 h-12 w-full text-body font-bold" disabled={!monthlyPlan} onClick={onComplete}>
        시작하기
      </Button>
    </>
  )
}
