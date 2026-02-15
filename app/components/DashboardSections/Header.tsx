import Image from 'next/image'

export default function Header() {
  return (
    <header className="h-[52px] flex items-center justify-between px-4">
      <div className="relative h-8 w-28">
        <Image
          src="/images/torich-logo.png"
          alt="토리치 로고"
          fill
          className="object-contain object-left"
        />
      </div>
    </header>
  )
}
