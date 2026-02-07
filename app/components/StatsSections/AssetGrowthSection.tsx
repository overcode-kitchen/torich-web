import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Investment } from '@/app/types/investment'
import AssetGrowthChart from '@/app/components/AssetGrowthChart'

interface AssetGrowthSectionProps {
  selectedYear: number
  setSelectedYear: (year: number) => void
  records: Investment[]
}

export default function AssetGrowthSection({
  selectedYear,
  setSelectedYear,
  records,
}: AssetGrowthSectionProps) {
  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
            >
              {selectedYear}년 뒤
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[120px]">
            <DropdownMenuItem onClick={() => setSelectedYear(3)}>3년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(5)}>5년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(10)}>10년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(15)}>15년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(20)}>20년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(25)}>25년 뒤</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedYear(30)}>30년 뒤</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <h2 className="text-sm font-semibold text-foreground-muted">예상 수익 차트</h2>
      </div>
      <AssetGrowthChart investments={records} selectedYear={selectedYear} />
    </section>
  )
}
