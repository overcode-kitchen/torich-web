// npm·yarn으로 설치하는 것을 막는다.
//
// packageManager 필드만으로는 부족하다. 그건 corepack이 켜져 있을 때만 강제되고,
// corepack이 없는 환경(homebrew node 등)에서는 npm이 그냥 설치를 진행한다.
// 그러면 package-lock.json이 생겨 pnpm-lock.yaml과 어긋나고,
// CI(`pnpm install --frozen-lockfile`)가 깨진다.
const ua = process.env.npm_config_user_agent ?? ''

if (!ua.startsWith('pnpm')) {
  const used = ua.split('/')[0] || '알 수 없는 도구'
  console.error(`
✖ 이 저장소는 pnpm 전용입니다. (감지된 도구: ${used})

  pnpm install

  pnpm이 없다면:  npm install -g pnpm@10

  이유: CI가 pnpm-lock.yaml을 --frozen-lockfile로 검증합니다.
  npm으로 설치하면 package-lock.json만 갱신되어 두 파일이 어긋나고 CI가 깨집니다.
`)
  process.exit(1)
}
