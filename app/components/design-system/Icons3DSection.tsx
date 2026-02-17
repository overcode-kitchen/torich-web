"use client"

import Image from "next/image"
import { NameLabel } from "./DesignSystemShared"

const ICONS_3D = [
    "acorn-1.png",
    "acorn-2.png",
    "acorn-3.png",
    "bell-green.png",
    "bell-neon-green.png",
    "bell-silver.png",
    "bell-yellow.png",
    "check.png",
    "clap.png",
    "coin-angle.png",
    "coin-front.png",
    "money bag.png",
    "piggy bank.png",
    "search.png",
    "siren.png",
    "speech bubble.png",
    "torich face.png",
] as const

export function Icons3DSection() {
    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight text-coolgray-900">
                3D 아이콘
            </h2>
            <div className="rounded-xl border border-coolgray-200 bg-white p-6">
                <p className="text-base text-muted-foreground mb-6">
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">public/icons/3d/</code> 에 있는 PNG 아이콘입니다. 사용 시 Next.js <code className="text-sm bg-muted px-1.5 py-0.5 rounded">Image</code> 컴포넌트를 사용하세요.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {ICONS_3D.map((filename) => {
                        const name = filename.replace(/\.png$/i, "")
                        return (
                            <div
                                key={filename}
                                className="flex flex-col items-center gap-3 rounded-xl border border-coolgray-100 bg-coolgray-25 p-4"
                            >
                                <div className="relative size-16 flex items-center justify-center">
                                    <Image
                                        src={`/icons/3d/${filename}`}
                                        alt={name}
                                        width={64}
                                        height={64}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="w-full min-w-0 text-center">
                                    <NameLabel
                                        label={name}
                                        token={`/icons/3d/${filename}`}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
