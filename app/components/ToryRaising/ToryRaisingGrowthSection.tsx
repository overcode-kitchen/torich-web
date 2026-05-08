import { Button } from '@/components/ui/button'
import type { ToryRecentEarning } from '@/app/hooks/tory-raising/useToryRaisingData'

export default function ToryRaisingGrowthSection({
  titleEmoji,
  titleName,
  level,
  progressPercent,
  nextLevel,
  acornsToNext,
  appearanceStageIndex,
  attendanceStreak,
  balance,
  recentEarnings,
  onClaimAttendance,
  onClaimInvestmentComplete,
  onClaimToryTabVisit,
  onResetDemo,
}: {
  titleEmoji: string
  titleName: string
  level: number
  progressPercent: number
  nextLevel: number | null
  acornsToNext: number | null
  appearanceStageIndex: number
  attendanceStreak: number
  balance: number
  recentEarnings: ToryRecentEarning[]
  onClaimAttendance: () => void
  onClaimInvestmentComplete: () => void
  onClaimToryTabVisit: () => void
  onResetDemo: () => void
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-foreground-soft">토리 성장</div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {titleEmoji} {titleName}
        </div>
        <div className="text-base text-muted-foreground">
          토리 · Lv.{level}
          <span className="text-foreground-subtle"> (외형 스테이지 {appearanceStageIndex}/5)</span>
        </div>
      </header>

      {/* 이미지 영역은 MVP 데모에서 비움 */}
      <div
        className="aspect-square w-full rounded-2xl border border-border-subtle bg-surface p-4 flex items-center justify-center text-center text-muted-foreground"
        aria-label="토리 일러스트 영역 (비움)"
      >
        이미지 자리 (MVP 데모)
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-hover p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            다음 레벨까지
            <span className="ml-2 text-base font-semibold text-foreground">{acornsToNext ?? 0}개</span>
          </div>
          <div className="text-sm font-semibold text-foreground-soft">
            {nextLevel ? `Lv.${level} → Lv.${nextLevel}` : '최대 레벨'}
          </div>
        </div>

        <div className="h-3 rounded-full bg-surface-hover overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-surface-strong"
            style={{
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              transition: 'width 300ms ease',
            }}
            aria-label={`진행도 ${Math.round(progressPercent)}%`}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">🌰 보유: {balance}</div>
          <div className="text-sm text-muted-foreground">🔥 연속 {attendanceStreak}일</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button size="lg" variant="secondary" onClick={onClaimAttendance}>
          🌰 출석 보상 (+1)
        </Button>
        <Button size="lg" variant="secondary" onClick={onClaimInvestmentComplete}>
          ✅ 투자 완료 체크 (+10)
        </Button>
        <Button size="lg" variant="soft" onClick={onClaimToryTabVisit}>
          🐿️ 토리 탭 방문 보상 (+1)
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground-soft">최근 획득</div>
        <Button size="sm" variant="ghost" asChild={false} onClick={onResetDemo} className="text-xs">
          데모 초기화
        </Button>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface p-4">
        {recentEarnings.length === 0 ? (
          <div className="text-sm text-muted-foreground">아직 기록이 없어요. 버튼을 눌러보세요.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentEarnings.slice(0, 5).map((e) => (
              <li key={`${e.type}-${e.at}`} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {e.type === 'attendance' && '출석'}
                  {e.type === 'investment' && '투자 완료'}
                  {e.type === 'streak' && '연속/방문 보상'}
                  {e.type === 'visit_hour' && '방문 보상'}
                  {e.type === 'play' && '놀아주기'}
                  {e.type === 'pet' && '쓰다듬기'}
                  {e.type === 'shop_buy' && '상점 구매'}
                  {e.type === 'levelup' && '레벨업'}
                  {e.type === 'title_change' && '칭호 변경'}
                </span>
                <span className="text-sm font-semibold text-foreground">+{e.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

